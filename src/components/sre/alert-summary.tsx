"use client";

import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
    Activity,
    Bell,
    Clock,
    Server,
    ExternalLink,
    Terminal,
} from "lucide-react";

const alertSchema = z.object({
    id: z.string(),
    severity: z.enum(["critical", "warning", "info"]),
    title: z.string(),
    service: z.string(),
    timestamp: z.string(),
    status: z.enum(["firing", "acknowledged", "resolved"]),
});

export const alertSummarySchema = z.object({
    alerts: z.array(alertSchema),
    showAll: z.boolean().optional(),
});

type AlertSummaryProps = z.infer<typeof alertSummarySchema>;

function formatTimeAgo(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "NOW";
    if (diffMins < 60) return `${diffMins}M_AGO`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}H_AGO`;
    return `${Math.floor(diffHours / 24)}D_AGO`;
}

function AlertTerminalCard({ alert, index }: { alert: z.infer<typeof alertSchema>; index: number }) {
    const isCritical = alert.severity === 'critical';

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={`font-mono p-3 border border-white/5 bg-black/20 group hover:border-cyan-500/30 transition-colors ${isCritical ? 'border-l-red-500/50' : 'border-l-cyan-500/30'
                } border-l-2`}
        >
            <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] px-1 font-bold ${alert.severity === 'critical' ? 'bg-red-500 text-white' :
                                alert.severity === 'warning' ? 'bg-amber-500 text-black' :
                                    'bg-cyan-500 text-black'
                            }`}>
                            {alert.severity.toUpperCase()}
                        </span>
                        <h4 className="text-xs font-bold text-gray-200 truncate">{alert.title.toUpperCase()}</h4>
                    </div>

                    <div className="flex items-center gap-4 text-[9px] text-gray-500 uppercase tracking-tighter mt-2">
                        <span className="flex items-center gap-1">
                            <Server className="w-2.5 h-2.5" /> {alert.service}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" /> {formatTimeAgo(alert.timestamp)}
                        </span>
                        <span className={`flex items-center gap-1 font-bold ${alert.status === 'firing' ? 'text-red-500 animate-pulse' : 'text-cyan-500'
                            }`}>
                            ● {alert.status}
                        </span>
                    </div>
                </div>
                <button className="opacity-0 group-hover:opacity-100 p-1.5 bg-cyan-500/10 text-cyan-400 rounded transition-all">
                    <ExternalLink className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
}

export function AlertSummary(props: AlertSummaryProps) {
    const { alerts = [], showAll = false } = props || {};

    const criticalCount = alerts?.filter(a => a.severity === "critical").length || 0;
    const warningCount = alerts?.filter(a => a.severity === "warning").length || 0;

    const displayAlerts = showAll ? alerts : alerts?.slice(0, 8) || [];

    return (
        <div className="space-y-4 font-mono terminal-window border-gray-800 bg-black/40">
            {/* Header HUD */}
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                    <Terminal className="w-3 h-3 text-cyan-500" />
                    <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">ALERT_QUEUE_MONITOR</span>
                </div>
                <div className="flex gap-3 text-[9px]">
                    <span className="text-red-500 font-bold">{criticalCount} CRIT</span>
                    <span className="text-amber-500 font-bold">{warningCount} WARN</span>
                </div>
            </div>

            <div className="p-2 space-y-1">
                {displayAlerts.length === 0 ? (
                    <div className="text-center py-6 text-gray-600 text-[10px] uppercase">
                        No active alerts in queue
                    </div>
                ) : (
                    displayAlerts.map((alert, index) => (
                        <AlertTerminalCard key={alert.id} alert={alert} index={index} />
                    ))
                )}
            </div>

            {alerts.length > 8 && !showAll && (
                <div className="px-4 py-2 border-t border-gray-800 bg-black/50 text-center">
                    <button className="text-[9px] text-cyan-500 hover:text-cyan-400 font-bold uppercase tracking-widest">
                        Expand full alert manifest ({alerts.length})
                    </button>
                </div>
            )}
        </div>
    );
}

export const alertSummaryComponent: TamboComponent = {
    name: "AlertSummary",
    description: "Terminal-style alert manifest overview.",
    component: AlertSummary,
    propsSchema: alertSummarySchema,
};
