"use client";

import { createClient } from "@/lib/supabase/client";
import type { TamboThread } from "@tambo-ai/react";

let hasLoggedMissingTable = false;

function getThreadTitle(thread: TamboThread): string {
    return thread.name || "Untitled conversation";
}

function getLastMessagePreview(thread: TamboThread): string {
    const lastMessage = thread.messages?.[thread.messages.length - 1];
    if (!lastMessage?.content) return "";

    const content = lastMessage.content as unknown;

    if (typeof content === "string") {
        return content.slice(0, 280);
    }

    if (Array.isArray(content)) {
        const text = content
            .filter((part: unknown) => (part as { type?: string })?.type === "text")
            .map((part: unknown) => String((part as { text?: string })?.text || ""))
            .join(" ")
            .trim();
        return text.slice(0, 280);
    }

    return "";
}

function getThreadLastMessageTimestamp(thread: TamboThread): string | null {
    const lastMessage = thread.messages?.[thread.messages.length - 1];
    return lastMessage?.createdAt ?? null;
}

export async function persistThreadSnapshot(thread: TamboThread): Promise<void> {
    if (!thread?.id || !thread.messages?.length) {
        return;
    }

    // Skip placeholder thread IDs created before first server round-trip.
    if (thread.id.toLowerCase().includes("placeholder")) {
        return;
    }

    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return;
    }

    const payload = {
        user_id: user.id,
        thread_id: thread.id,
        title: getThreadTitle(thread),
        message_count: thread.messages.length,
        last_message_at: getThreadLastMessageTimestamp(thread),
        last_message_preview: getLastMessagePreview(thread),
        thread_payload: thread,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
        .from("thread_history")
        .upsert(payload, { onConflict: "user_id,thread_id" });

    if (!error) {
        return;
    }

    // 42P01 = undefined_table
    if (error.code === "42P01") {
        if (!hasLoggedMissingTable) {
            console.warn(
                "thread_history table not found. Run supabase/schema.sql migration to enable message history persistence.",
            );
            hasLoggedMissingTable = true;
        }
        return;
    }

    console.error("Failed to persist thread snapshot:", error.message);
}
