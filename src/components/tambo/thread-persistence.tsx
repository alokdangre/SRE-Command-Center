"use client";

import { persistThreadSnapshot } from "@/services/message-history-service";
import { useTambo } from "@tambo-ai/react";
import { useEffect, useRef } from "react";

/**
 * Persists thread snapshots to Supabase as messages arrive.
 * This is a lightweight audit/history layer independent of Tambo thread storage.
 */
export function ThreadPersistence() {
    const { thread } = useTambo();
    const lastPersistedSignatureRef = useRef<string>("");

    useEffect(() => {
        if (!thread?.id || !thread.messages?.length) {
            return;
        }

        const lastMessage = thread.messages[thread.messages.length - 1];
        const signature = [
            thread.id,
            thread.messages.length,
            lastMessage?.id || "",
            lastMessage?.createdAt || "",
        ].join(":");

        if (signature === lastPersistedSignatureRef.current) {
            return;
        }

        const timeout = window.setTimeout(() => {
            void persistThreadSnapshot(thread);
            lastPersistedSignatureRef.current = signature;
        }, 1200);

        return () => window.clearTimeout(timeout);
    }, [thread]);

    return null;
}
