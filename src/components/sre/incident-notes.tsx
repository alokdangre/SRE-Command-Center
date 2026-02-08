"use client";

import type { TamboComponent } from "@tambo-ai/react";
import { withInteractable } from "@tambo-ai/react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, FileText, ShieldAlert } from "lucide-react";
import type { ElementType } from "react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const noteEntrySchema = z.object({
    id: z.string(),
    author: z.string(),
    timestamp: z.string(),
    category: z.enum(["observation", "action", "decision", "risk"]),
    content: z.string(),
});

export const incidentNotesSchema = z.object({
    incidentId: z.string(),
    title: z.string().optional(),
    status: z.enum(["investigating", "identified", "mitigating", "resolved"]).default("investigating"),
    notes: z.array(noteEntrySchema),
    nextSteps: z.array(z.string()).optional(),
    summary: z.string().optional(),
});

type IncidentNotesProps = z.infer<typeof incidentNotesSchema>;
type NoteEntry = z.infer<typeof noteEntrySchema>;

const categoryStyles: Record<NoteEntry["category"], { icon: ElementType; color: string; label: string }> = {
    observation: { icon: FileText, color: "text-cyan-300 border-cyan-500/40", label: "Observation" },
    action: { icon: CheckCircle2, color: "text-green-300 border-green-500/40", label: "Action" },
    decision: { icon: ShieldAlert, color: "text-amber-300 border-amber-500/40", label: "Decision" },
    risk: { icon: AlertTriangle, color: "text-red-300 border-red-500/40", label: "Risk" },
};

function IncidentNotesBase(props: IncidentNotesProps) {
    const [state, setState] = useState<IncidentNotesProps>(props);
    const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
    const prevRef = useRef<IncidentNotesProps>(props);

    useEffect(() => {
        const prev = prevRef.current;
        const changed = new Set<string>();

        if (props.status !== prev.status) changed.add("status");
        if (props.summary !== prev.summary) changed.add("summary");
        if (props.notes.length !== prev.notes.length) changed.add("notes");
        if ((props.nextSteps?.join("|") || "") !== (prev.nextSteps?.join("|") || "")) changed.add("nextSteps");

        setState(props);
        prevRef.current = props;

        if (changed.size > 0) {
            setUpdatedFields(changed);
            const timer = setTimeout(() => setUpdatedFields(new Set()), 1500);
            return () => clearTimeout(timer);
        }
    }, [props]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border border-gray-700 bg-gray-900/70 p-5 ${updatedFields.size > 0 ? "ring-1 ring-cyan-400/60" : ""}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-sm text-white font-semibold tracking-wide">
                        {state.title || "Incident Notes"}
                    </h3>
                    <p className="text-xs text-gray-400">Incident #{state.incidentId}</p>
                </div>
                <span
                    className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${
                        state.status === "resolved"
                            ? "text-green-300 border-green-500/40"
                            : state.status === "mitigating"
                                ? "text-amber-300 border-amber-500/40"
                                : "text-cyan-300 border-cyan-500/40"
                    } ${updatedFields.has("status") ? "animate-pulse" : ""}`}
                >
                    {state.status}
                </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {state.notes.map((note) => {
                    const style = categoryStyles[note.category];
                    const Icon = style.icon;
                    return (
                        <div key={note.id} className={`border rounded-lg p-3 ${style.color} bg-black/20`}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] uppercase tracking-wide">{style.label}</span>
                                </div>
                                <span className="text-[10px] text-gray-400">{note.timestamp}</span>
                            </div>
                            <p className="text-xs text-gray-200">{note.content}</p>
                            <p className="text-[10px] text-gray-500 mt-1">by {note.author}</p>
                        </div>
                    );
                })}
            </div>

            {(state.nextSteps?.length || 0) > 0 && (
                <div className={`mt-4 pt-4 border-t border-gray-700 ${updatedFields.has("nextSteps") ? "animate-pulse" : ""}`}>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Next Steps</p>
                    <ul className="space-y-1.5">
                        {state.nextSteps?.map((step, index) => (
                            <li key={`${index}-${step}`} className="text-xs text-gray-200">
                                {index + 1}. {step}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {state.summary && (
                <div className={`mt-4 pt-4 border-t border-gray-700 ${updatedFields.has("summary") ? "animate-pulse" : ""}`}>
                    <p className="text-[11px] uppercase tracking-wider text-gray-400 mb-1">Summary</p>
                    <p className="text-xs text-gray-200">{state.summary}</p>
                </div>
            )}
        </motion.div>
    );
}

export const InteractableIncidentNotes = withInteractable(IncidentNotesBase, {
    componentName: "IncidentNotes",
    description: "Collaborative incident notes panel that AI can update with observations, decisions, and mitigation progress.",
    propsSchema: incidentNotesSchema,
});

export const incidentNotesComponent: TamboComponent = {
    name: "IncidentNotes",
    description: "Interactive incident notes feed for collaborative war-room updates.",
    component: InteractableIncidentNotes,
    propsSchema: incidentNotesSchema,
};
