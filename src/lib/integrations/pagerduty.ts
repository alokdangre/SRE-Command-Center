/**
 * PagerDuty Integration
 * Fetches incident data, on-call schedules, and manages incident lifecycle
 */

import { getIntegrationConfig } from "./config";

// Types
export interface PagerDutyIncident {
    id: string;
    incidentNumber: number;
    title: string;
    description: string;
    status: "triggered" | "acknowledged" | "resolved";
    urgency: "high" | "low";
    priority?: {
        id: string;
        name: string;
        color: string;
    };
    service: {
        id: string;
        name: string;
    };
    assignees: Array<{
        id: string;
        name: string;
        email: string;
    }>;
    createdAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
    lastStatusChangeAt: string;
    htmlUrl: string;
}

export interface PagerDutyTimelineEntry {
    id: string;
    type: "trigger" | "acknowledge" | "resolve" | "annotate" | "escalate" | "assign" | "delegate";
    timestamp: string;
    message: string;
    agent?: {
        type: string;
        name: string;
    };
    channel?: {
        type: string;
    };
}

export interface PagerDutyOnCall {
    userId: string;
    userName: string;
    userEmail: string;
    escalationPolicy: string;
    escalationLevel: number;
    start: string;
    end: string;
}

/**
 * Make authenticated request to PagerDuty API
 */
async function pagerDutyRequest(
    endpoint: string,
    options: RequestInit = {}
): Promise<Response> {
    const config = await getIntegrationConfig();

    if (!config.pagerduty?.enabled || !config.pagerduty?.apiKey) {
        throw new Error("PagerDuty integration not configured");
    }

    const url = `https://api.pagerduty.com${endpoint}`;

    return fetch(url, {
        ...options,
        headers: {
            Authorization: `Token token=${config.pagerduty.apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.pagerduty+json;version=2",
            ...options.headers,
        },
    });
}

/**
 * Get current active incidents
 */
export async function getPagerDutyIncidents(options: {
    statuses?: Array<"triggered" | "acknowledged" | "resolved">;
    urgencies?: Array<"high" | "low">;
    serviceIds?: string[];
    limit?: number;
} = {}): Promise<{ incidents: PagerDutyIncident[]; error?: string }> {
    try {
        const config = await getIntegrationConfig();

        if (!config.pagerduty?.enabled) {
            return { incidents: [], error: "PagerDuty integration not configured. Go to Settings to connect." };
        }

        const params = new URLSearchParams();

        // Default to active incidents
        const statuses = options.statuses || ["triggered", "acknowledged"];
        statuses.forEach(s => params.append("statuses[]", s));

        if (options.urgencies) {
            options.urgencies.forEach(u => params.append("urgencies[]", u));
        }

        if (options.serviceIds && options.serviceIds.length > 0) {
            options.serviceIds.forEach(id => params.append("service_ids[]", id));
        } else if (config.pagerduty.serviceIds && config.pagerduty.serviceIds.length > 0) {
            config.pagerduty.serviceIds.forEach(id => params.append("service_ids[]", id));
        }

        params.append("limit", String(options.limit || 25));
        params.append("sort_by", "created_at:desc");

        const response = await pagerDutyRequest(`/incidents?${params.toString()}`);

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        const data = await response.json();

        const incidents: PagerDutyIncident[] = data.incidents.map((inc: {
            id: string;
            incident_number: number;
            title: string;
            description?: string;
            status: string;
            urgency: string;
            priority?: { id: string; summary: string; color: string };
            service: { id: string; summary: string };
            assignments: Array<{ assignee: { id: string; summary: string; email?: string } }>;
            created_at: string;
            acknowledged_at?: string;
            resolved_at?: string;
            last_status_change_at: string;
            html_url: string;
        }) => ({
            id: inc.id,
            incidentNumber: inc.incident_number,
            title: inc.title,
            description: inc.description || "",
            status: inc.status as PagerDutyIncident["status"],
            urgency: inc.urgency as PagerDutyIncident["urgency"],
            priority: inc.priority ? {
                id: inc.priority.id,
                name: inc.priority.summary,
                color: inc.priority.color,
            } : undefined,
            service: {
                id: inc.service.id,
                name: inc.service.summary,
            },
            assignees: inc.assignments.map(a => ({
                id: a.assignee.id,
                name: a.assignee.summary,
                email: a.assignee.email || "",
            })),
            createdAt: inc.created_at,
            acknowledgedAt: inc.acknowledged_at,
            resolvedAt: inc.resolved_at,
            lastStatusChangeAt: inc.last_status_change_at,
            htmlUrl: inc.html_url,
        }));

        return { incidents };
    } catch (error) {
        console.error("PagerDuty error:", error);
        return {
            incidents: [],
            error: error instanceof Error ? error.message : "Failed to fetch incidents",
        };
    }
}

/**
 * Get incident timeline/log entries
 */
export async function getIncidentTimeline(incidentId: string): Promise<{
    timeline: PagerDutyTimelineEntry[];
    error?: string;
}> {
    try {
        const response = await pagerDutyRequest(`/incidents/${incidentId}/log_entries?include[]=channels&is_overview=true`);

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        const data = await response.json();

        const timeline: PagerDutyTimelineEntry[] = data.log_entries.map((entry: {
            id: string;
            type: string;
            created_at: string;
            summary: string;
            agent?: { type: string; summary: string };
            channel?: { type: string };
        }) => ({
            id: entry.id,
            type: mapLogEntryType(entry.type),
            timestamp: entry.created_at,
            message: entry.summary,
            agent: entry.agent ? {
                type: entry.agent.type,
                name: entry.agent.summary,
            } : undefined,
            channel: entry.channel,
        }));

        return { timeline };
    } catch (error) {
        return {
            timeline: [],
            error: error instanceof Error ? error.message : "Failed to fetch timeline",
        };
    }
}

function mapLogEntryType(pdType: string): PagerDutyTimelineEntry["type"] {
    const typeMap: Record<string, PagerDutyTimelineEntry["type"]> = {
        "trigger_log_entry": "trigger",
        "acknowledge_log_entry": "acknowledge",
        "resolve_log_entry": "resolve",
        "annotate_log_entry": "annotate",
        "escalate_log_entry": "escalate",
        "assign_log_entry": "assign",
        "delegate_log_entry": "delegate",
    };
    return typeMap[pdType] || "annotate";
}

/**
 * Get who is currently on-call
 */
export async function getOnCallSchedule(): Promise<{
    onCalls: PagerDutyOnCall[];
    error?: string;
}> {
    try {
        const now = new Date().toISOString();
        const response = await pagerDutyRequest(`/oncalls?since=${now}&until=${now}`);

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        const data = await response.json();

        const onCalls: PagerDutyOnCall[] = data.oncalls.map((oc: {
            user: { id: string; summary: string; email: string };
            escalation_policy: { summary: string };
            escalation_level: number;
            start: string;
            end: string;
        }) => ({
            userId: oc.user.id,
            userName: oc.user.summary,
            userEmail: oc.user.email,
            escalationPolicy: oc.escalation_policy.summary,
            escalationLevel: oc.escalation_level,
            start: oc.start,
            end: oc.end,
        }));

        return { onCalls };
    } catch (error) {
        return {
            onCalls: [],
            error: error instanceof Error ? error.message : "Failed to fetch on-call schedule",
        };
    }
}

/**
 * Acknowledge an incident
 */
export async function acknowledgeIncident(
    incidentId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await pagerDutyRequest(`/incidents/${incidentId}`, {
            method: "PUT",
            body: JSON.stringify({
                incident: {
                    type: "incident_reference",
                    status: "acknowledged",
                },
            }),
            headers: {
                From: userId, // PagerDuty requires this header
            },
        });

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to acknowledge incident",
        };
    }
}

/**
 * Resolve an incident
 */
export async function resolveIncident(
    incidentId: string,
    userId: string,
    resolution?: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await pagerDutyRequest(`/incidents/${incidentId}`, {
            method: "PUT",
            body: JSON.stringify({
                incident: {
                    type: "incident_reference",
                    status: "resolved",
                    resolution: resolution,
                },
            }),
            headers: {
                From: userId,
            },
        });

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to resolve incident",
        };
    }
}

/**
 * Add a note to an incident
 */
export async function addIncidentNote(
    incidentId: string,
    userId: string,
    content: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await pagerDutyRequest(`/incidents/${incidentId}/notes`, {
            method: "POST",
            body: JSON.stringify({
                note: {
                    content: content,
                },
            }),
            headers: {
                From: userId,
            },
        });

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to add note",
        };
    }
}

/**
 * Get services from PagerDuty (for config selection)
 */
export async function getPagerDutyServices(): Promise<{
    services: Array<{ id: string; name: string; status: string }>;
    error?: string;
}> {
    try {
        const response = await pagerDutyRequest("/services?limit=100");

        if (!response.ok) {
            throw new Error(`PagerDuty API error: ${response.status}`);
        }

        const data = await response.json();

        return {
            services: data.services.map((s: { id: string; name: string; status: string }) => ({
                id: s.id,
                name: s.name,
                status: s.status,
            })),
        };
    } catch (error) {
        return {
            services: [],
            error: error instanceof Error ? error.message : "Failed to fetch services",
        };
    }
}

/**
 * Verify PagerDuty integration by making a test call
 */
export async function verifyPagerDutyIntegration(apiKey: string): Promise<{
    success: boolean;
    error?: string;
    accountName?: string;
}> {
    try {
        const response = await fetch("https://api.pagerduty.com/users/me", {
            headers: {
                Authorization: `Token token=${apiKey}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.pagerduty+json;version=2",
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                return { success: false, error: "Invalid API key" };
            }
            return { success: false, error: `PagerDuty API error: ${response.status}` };
        }

        const data = await response.json();
        return {
            success: true,
            accountName: data.user?.name || "Unknown User"
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to verify"
        };
    }
}
