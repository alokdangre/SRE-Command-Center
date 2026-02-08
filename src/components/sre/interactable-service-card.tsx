"use client";

import type { TamboComponent } from "@tambo-ai/react";
import { withInteractable } from "@tambo-ai/react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Clock3, Gauge, Signal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

export const serviceCardSchema = z.object({
    id: z.string(),
    serviceName: z.string(),
    status: z.enum(["healthy", "degraded", "critical", "unknown"]),
    uptime: z.number(),
    latencyMs: z.number(),
    errorRate: z.number(),
    requestsPerSecond: z.number(),
    version: z.string().optional(),
    note: z.string().optional(),
});

type ServiceCardProps = z.infer<typeof serviceCardSchema>;

function ServiceCardBase(props: ServiceCardProps) {
    const [state, setState] = useState<ServiceCardProps>(props);
    const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
    const prevPropsRef = useRef<ServiceCardProps>(props);

    useEffect(() => {
        const prev = prevPropsRef.current;
        const changed = new Set<string>();

        if (props.status !== prev.status) changed.add("status");
        if (props.latencyMs !== prev.latencyMs) changed.add("latencyMs");
        if (props.errorRate !== prev.errorRate) changed.add("errorRate");
        if (props.requestsPerSecond !== prev.requestsPerSecond) changed.add("requestsPerSecond");
        if (props.note !== prev.note) changed.add("note");

        setState(props);
        prevPropsRef.current = props;

        if (changed.size > 0) {
            setUpdatedFields(changed);
            const timer = setTimeout(() => setUpdatedFields(new Set()), 1200);
            return () => clearTimeout(timer);
        }
    }, [props]);

    const statusStyles =
        state.status === "critical"
            ? "border-red-500/50 bg-red-500/5"
            : state.status === "degraded"
                ? "border-amber-500/50 bg-amber-500/5"
                : state.status === "healthy"
                    ? "border-green-500/40 bg-green-500/5"
                    : "border-gray-600 bg-gray-800/30";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 font-mono ${statusStyles} ${updatedFields.size > 0 ? "ring-1 ring-cyan-400/60" : ""}`}
        >
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">service unit</p>
                    <h4 className="text-sm text-white font-semibold">{state.serviceName}</h4>
                </div>
                <div className="flex items-center gap-1 text-xs">
                    {state.status === "healthy" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="uppercase tracking-wider text-gray-300">{state.status}</span>
                </div>
            </div>

            <div className="space-y-2 text-xs text-gray-300">
                <div className={`flex items-center justify-between ${updatedFields.has("latencyMs") ? "text-cyan-300" : ""}`}>
                    <span className="inline-flex items-center gap-1"><Gauge className="w-3 h-3" /> Latency</span>
                    <span>{Math.round(state.latencyMs)}ms</span>
                </div>
                <div className={`flex items-center justify-between ${updatedFields.has("errorRate") ? "text-cyan-300" : ""}`}>
                    <span className="inline-flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Error Rate</span>
                    <span>{state.errorRate.toFixed(2)}%</span>
                </div>
                <div className={`flex items-center justify-between ${updatedFields.has("requestsPerSecond") ? "text-cyan-300" : ""}`}>
                    <span className="inline-flex items-center gap-1"><Signal className="w-3 h-3" /> Throughput</span>
                    <span>{Math.round(state.requestsPerSecond)}/s</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1"><Clock3 className="w-3 h-3" /> Uptime</span>
                    <span>{state.uptime.toFixed(3)}%</span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-700/60 flex items-center justify-between text-[10px] text-gray-500">
                <span>{state.version || "v1.0.0"}</span>
                {state.note ? (
                    <span className={updatedFields.has("note") ? "text-cyan-300" : "text-gray-400"}>{state.note}</span>
                ) : (
                    <span>live feed</span>
                )}
            </div>
        </motion.div>
    );
}

export const InteractableServiceCard = withInteractable(ServiceCardBase, {
    componentName: "ServiceCard",
    description: "A persistent service status card that AI can update as metrics change during an incident.",
    propsSchema: serviceCardSchema,
});

export const interactableServiceCardComponent: TamboComponent = {
    name: "ServiceCard",
    description:
        "Interactable card for a single service. Use this when tracking one critical service that needs live updates over the conversation.",
    component: InteractableServiceCard,
    propsSchema: serviceCardSchema,
};
