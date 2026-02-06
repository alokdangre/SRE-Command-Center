"use client";

import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    User,
    Terminal,
} from "lucide-react";

const timelineEventSchema = z.object({
    time: z.string(),
    event: z.string(),
    type: z.enum(["alert", "action", "note", "resolution"]),
    author: z.string(),
});

const metricPointSchema = z.object({
    time: z.string(),
    errorRate: z.number(),
    memory: z.number(),
});

export const incidentTimelineSchema = z.object({
    incidentId: z.string(),
    title: z.string(),
    severity: z.enum(["critical", "high", "medium", "low"]),
    status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
    timeline: z.array(timelineEventSchema),
    metricPoints: z.array(metricPointSchema),
});

type IncidentTimelineProps = z.infer<typeof incidentTimelineSchema>;

function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

export function IncidentTimeline(props: IncidentTimelineProps) {
    const {
        title = "INCIDENT_TIMELINE",
        severity = "medium",
        status = "investigating",
        timeline = [],
        metricPoints = [],
        incidentId = "UNKNOWN"
    } = props || {};

    const maxErrorRate = metricPoints?.length > 0 ? Math.max(...metricPoints.map((p) => p.errorRate)) : 100;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="terminal-window rounded-none border-cyan-500/20 bg-black/60 p-0 overflow-hidden font-mono"
        >
            {/* Header Bar */}
            <div className="bg-cyan-500/10 px-4 py-2 border-b border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-cyan-400" />
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">ID: {incidentId}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border ${severity === 'critical' ? 'border-red-500 text-red-500 bg-red-500/10' : 'border-cyan-500/50 text-cyan-500'
                        }`}>
                        {severity.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metric Display */}
                <div>
                    <div className="text-[10px] text-gray-400 mb-4 uppercase tracking-tighter">Metric_Drift: // Error_Rate</div>
                    <div className="flex items-end gap-1 h-20 border-b border-gray-800 pb-1">
                        {metricPoints.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(point.errorRate / maxErrorRate) * 100}%` }}
                                    className="w-full bg-cyan-500/40 border-t border-cyan-400"
                                    title={`Error: ${point.errorRate}%`}
                                />
                                <span className="text-[8px] text-gray-600 mt-1">{formatTime(point.time).slice(3, 8)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Event Feed */}
                <div className="space-y-4 max-h-[200px] overflow-auto pr-2 custom-scrollbar">
                    <div className="text-[10px] text-gray-400 mb-2 uppercase tracking-tighter">Event_Feed:</div>
                    {timeline.map((event, index) => (
                        <div key={index} className="flex gap-3 text-xs border-l border-gray-800 pl-3 relative">
                            <div className="absolute -left-[4.5px] top-1 w-2 h-2 rounded-full bg-gray-800 border border-gray-700" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                    <span className="text-cyan-500/70">[{formatTime(event.time)}]</span>
                                    <span className="text-gray-600 flex items-center gap-1">
                                        <User className="w-2 h-2" /> {event.author}
                                    </span>
                                </div>
                                <div className="text-gray-300 leading-tight">
                                    <span className="text-cyan-400 mr-2">➜</span>
                                    {event.event}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Status */}
            <div className="bg-black/40 px-4 py-1.5 border-t border-gray-800/50 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-gray-500 uppercase">Status: {status}</span>
                </div>
                <span className="text-gray-600">LIVE_TELEMETRY_CONNECTED</span>
            </div>
        </motion.div>
    );
}

export const incidentTimelineComponent: TamboComponent = {
    name: "IncidentTimeline",
    description: "Terminal-style visualization of incident events and metrics.",
    component: IncidentTimeline,
    propsSchema: incidentTimelineSchema,
};
