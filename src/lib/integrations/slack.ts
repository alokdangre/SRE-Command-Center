/**
 * Slack Integration
 * Fetches team messages and context from Slack API
 */

import { getIntegrationConfig } from "./config";

// Types
export interface SlackMessage {
    ts: string;
    user: string;
    userName?: string;
    text: string;
    timestamp: string;
    channel: string;
    channelName?: string;
    threadTs?: string;
    reactions?: Array<{ name: string; count: number }>;
    files?: Array<{ name: string; mimetype: string; url: string }>;
}

export interface SlackChannel {
    id: string;
    name: string;
    isPrivate: boolean;
    memberCount: number;
    topic?: string;
    purpose?: string;
}

export interface SlackUser {
    id: string;
    name: string;
    realName: string;
    email?: string;
    avatar?: string;
    isBot: boolean;
}

/**
 * Make authenticated request to Slack API
 */
async function slackRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const config = await getIntegrationConfig();

    if (!config.slack?.enabled || !config.slack?.accessToken) {
        throw new Error("Slack integration not configured");
    }

    const url = `https://slack.com/api${endpoint}`;

    return fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${config.slack.accessToken}`,
            "Content-Type": "application/json; charset=utf-8",
            ...options.headers,
        },
    });
}

/**
 * Get recent messages from a channel
 */
export async function getSlackMessages(options: {
    channel?: string;
    limit?: number;
    oldest?: string;
} = {}): Promise<{ messages: SlackMessage[]; error?: string }> {
    try {
        const config = await getIntegrationConfig();

        if (!config.slack?.enabled) {
            return { messages: [], error: "Slack integration not configured. Go to Settings to connect." };
        }

        const channel = options.channel || config.slack.defaultChannel || "";
        if (!channel) {
            return { messages: [], error: "No channel specified" };
        }

        // Clean up channel name (remove # if present)
        const channelName = channel.replace(/^#/, '');

        // First, find the channel ID
        const listResponse = await slackRequest("/conversations.list?limit=200&types=public_channel,private_channel");
        if (!listResponse.ok) {
            throw new Error("Failed to list channels");
        }

        const listData = await listResponse.json();
        if (!listData.ok) {
            throw new Error(listData.error || "Failed to list channels");
        }

        const channelInfo = listData.channels.find(
            (c: { name: string; id: string }) => c.name === channelName || c.id === channelName
        );

        if (!channelInfo) {
            return { messages: [], error: `Channel "${channelName}" not found` };
        }

        // Get messages
        const params = new URLSearchParams({
            channel: channelInfo.id,
            limit: String(options.limit || 20),
        });

        if (options.oldest) {
            params.append("oldest", options.oldest);
        }

        const response = await slackRequest(`/conversations.history?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Failed to fetch messages");
        }

        // Get user info for messages
        const userIds = [...new Set(data.messages.map((m: { user: string }) => m.user).filter(Boolean))];
        const usersMap = new Map<string, string>();

        if (userIds.length > 0) {
            // Batch get users (Slack limits this)
            for (const userId of userIds.slice(0, 50)) {
                try {
                    const userResponse = await slackRequest(`/users.info?user=${userId}`);
                    const userData = await userResponse.json();
                    if (userData.ok && userData.user) {
                        usersMap.set(userId as string, userData.user.real_name || userData.user.name);
                    }
                } catch {
                    // Skip user if we can't get info
                }
            }
        }

        const messages: SlackMessage[] = data.messages.map((msg: {
            ts: string;
            user: string;
            text: string;
            thread_ts?: string;
            reactions?: Array<{ name: string; count: number }>;
            files?: Array<{ name: string; mimetype: string; url_private: string }>;
        }) => ({
            ts: msg.ts,
            user: msg.user,
            userName: usersMap.get(msg.user) || msg.user,
            text: msg.text,
            timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
            channel: channelInfo.id,
            channelName: channelInfo.name,
            threadTs: msg.thread_ts,
            reactions: msg.reactions,
            files: msg.files?.map(f => ({
                name: f.name,
                mimetype: f.mimetype,
                url: f.url_private,
            })),
        }));

        return { messages };
    } catch (error) {
        console.error("Slack error:", error);
        return {
            messages: [],
            error: error instanceof Error ? error.message : "Failed to fetch messages",
        };
    }
}

/**
 * Search messages across channels
 */
export async function searchSlackMessages(query: string, options: {
    count?: number;
    sort?: "score" | "timestamp";
} = {}): Promise<{ messages: SlackMessage[]; error?: string }> {
    try {
        const params = new URLSearchParams({
            query,
            count: String(options.count || 20),
            sort: options.sort || "timestamp",
        });

        const response = await slackRequest(`/search.messages?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Search failed");
        }

        const messages: SlackMessage[] = data.messages.matches.map((match: {
            ts: string;
            user: string;
            username?: string;
            text: string;
            channel: { id: string; name: string };
        }) => ({
            ts: match.ts,
            user: match.user,
            userName: match.username || match.user,
            text: match.text,
            timestamp: new Date(parseFloat(match.ts) * 1000).toISOString(),
            channel: match.channel.id,
            channelName: match.channel.name,
        }));

        return { messages };
    } catch (error) {
        return {
            messages: [],
            error: error instanceof Error ? error.message : "Search failed",
        };
    }
}

/**
 * Get thread replies
 */
export async function getThreadReplies(
    channel: string,
    threadTs: string
): Promise<{ messages: SlackMessage[]; error?: string }> {
    try {
        const params = new URLSearchParams({
            channel,
            ts: threadTs,
        });

        const response = await slackRequest(`/conversations.replies?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Failed to fetch thread");
        }

        const messages: SlackMessage[] = data.messages.map((msg: {
            ts: string;
            user: string;
            text: string;
            thread_ts?: string;
        }) => ({
            ts: msg.ts,
            user: msg.user,
            text: msg.text,
            timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
            channel,
            threadTs: msg.thread_ts,
        }));

        return { messages };
    } catch (error) {
        return {
            messages: [],
            error: error instanceof Error ? error.message : "Failed to fetch thread",
        };
    }
}

/**
 * Post a message to a channel
 */
export async function postSlackMessage(
    channel: string,
    text: string,
    options: {
        threadTs?: string;
        unfurlLinks?: boolean;
    } = {}
): Promise<{ success: boolean; ts?: string; error?: string }> {
    try {
        const response = await slackRequest("/chat.postMessage", {
            method: "POST",
            body: JSON.stringify({
                channel,
                text,
                thread_ts: options.threadTs,
                unfurl_links: options.unfurlLinks ?? true,
            }),
        });

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Failed to post message");
        }

        return { success: true, ts: data.ts };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to post message",
        };
    }
}

/**
 * Get list of channels the bot has access to
 */
export async function getSlackChannels(): Promise<{
    channels: SlackChannel[];
    error?: string;
}> {
    try {
        const response = await slackRequest("/conversations.list?limit=200&types=public_channel,private_channel");

        if (!response.ok) {
            throw new Error(`Slack API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.error || "Failed to list channels");
        }

        const channels: SlackChannel[] = data.channels.map((ch: {
            id: string;
            name: string;
            is_private: boolean;
            num_members: number;
            topic?: { value: string };
            purpose?: { value: string };
        }) => ({
            id: ch.id,
            name: ch.name,
            isPrivate: ch.is_private,
            memberCount: ch.num_members,
            topic: ch.topic?.value,
            purpose: ch.purpose?.value,
        }));

        return { channels };
    } catch (error) {
        return {
            channels: [],
            error: error instanceof Error ? error.message : "Failed to list channels",
        };
    }
}

/**
 * Verify Slack integration by testing the token
 */
export async function verifySlackIntegration(accessToken: string): Promise<{
    success: boolean;
    error?: string;
    teamName?: string;
    botName?: string;
}> {
    try {
        const response = await fetch("https://slack.com/api/auth.test", {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            return { success: false, error: `Slack API error: ${response.status}` };
        }

        const data = await response.json();

        if (!data.ok) {
            return { success: false, error: data.error || "Invalid token" };
        }

        return {
            success: true,
            teamName: data.team,
            botName: data.user,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to verify"
        };
    }
}

/**
 * Get context from team discussions (main function for SRE tools)
 */
export async function getSlackContext(options: {
    query?: string;
    channel?: string;
    hoursBack?: number;
} = {}): Promise<{
    messages: Array<{
        author: string;
        text: string;
        timestamp: string;
        channel: string;
        isRelevant?: boolean;
    }>;
    summary?: string;
    error?: string;
}> {
    const config = await getIntegrationConfig();

    if (!config.slack?.enabled) {
        return {
            messages: [],
            error: "Slack integration not configured. Go to Settings to connect."
        };
    }

    try {
        // If query provided, search for it
        if (options.query) {
            const { messages, error } = await searchSlackMessages(options.query, { count: 20 });

            if (error) {
                return { messages: [], error };
            }

            return {
                messages: messages.map(m => ({
                    author: m.userName || m.user,
                    text: m.text,
                    timestamp: m.timestamp,
                    channel: m.channelName || m.channel,
                    isRelevant: true,
                })),
                summary: `Found ${messages.length} messages matching "${options.query}"`,
            };
        }

        // Otherwise get recent messages from channel
        const oldest = options.hoursBack
            ? String((Date.now() - options.hoursBack * 60 * 60 * 1000) / 1000)
            : undefined;

        const { messages, error } = await getSlackMessages({
            channel: options.channel,
            limit: 30,
            oldest,
        });

        if (error) {
            return { messages: [], error };
        }

        return {
            messages: messages.map(m => ({
                author: m.userName || m.user,
                text: m.text,
                timestamp: m.timestamp,
                channel: m.channelName || m.channel,
            })),
            summary: `Retrieved ${messages.length} recent messages from ${messages[0]?.channelName || options.channel || 'default channel'}`,
        };
    } catch (error) {
        return {
            messages: [],
            error: error instanceof Error ? error.message : "Failed to get Slack context",
        };
    }
}
