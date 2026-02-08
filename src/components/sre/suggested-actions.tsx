"use client";

import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import { Loader2, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";

interface SuggestedAction {
    id: string;
    label: string;
    prompt: string;
}

const REMEDIATION_ACTIONS: SuggestedAction[] = [
    {
        id: "action-remediation-options",
        label: "List remediation options",
        prompt: "What remediation options are available for the notification service right now?",
    },
    {
        id: "action-scale-notification",
        label: "Scale notification service",
        prompt: "Scale the notification service and explain expected impact before execution.",
    },
    {
        id: "action-rollback-check",
        label: "Assess rollback safety",
        prompt: "Is rollback the safest option right now? Use commits, alerts, and incident context.",
    },
    {
        id: "action-incident-summary",
        label: "Generate incident summary",
        prompt: "Generate a concise incident summary with root cause confidence and next steps.",
    },
];

export function SuggestedActions({ className }: { className?: string }) {
    const { sendThreadMessage, thread, isIdle } = useTambo();
    const [runningActionId, setRunningActionId] = useState<string | null>(null);

    const triggerAction = async (action: SuggestedAction) => {
        if (!isIdle || runningActionId) return;

        setRunningActionId(action.id);
        try {
            await sendThreadMessage(action.prompt, {
                threadId: thread.id,
                streamResponse: true,
            });
        } catch (error) {
            console.error("Failed to execute suggested action:", error);
        } finally {
            setRunningActionId(null);
        }
    };

    return (
        <div className={cn("px-4 py-3 border-t border-cyan-500/10 bg-black/60", className)}>
            <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest text-cyan-500/80">
                <Wrench className="w-3 h-3" />
                Suggested_Actions
            </div>
            <div className="flex flex-wrap gap-2">
                {REMEDIATION_ACTIONS.map((action) => {
                    const isRunning = runningActionId === action.id;
                    return (
                        <button
                            key={action.id}
                            onClick={() => void triggerAction(action)}
                            disabled={!isIdle || !!runningActionId}
                            className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded border transition-colors",
                                "border-cyan-500/25 text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10",
                                "disabled:opacity-50 disabled:cursor-not-allowed",
                            )}
                        >
                            {isRunning ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Sparkles className="w-3 h-3" />
                            )}
                            {action.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
