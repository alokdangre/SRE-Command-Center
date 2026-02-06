"use client";

import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { motion } from "framer-motion";
import {
    Activity,
    Cpu,
    Server,
    Zap,
    AlertCircle,
    CheckCircle2,
} from "lucide-react";

const serviceSchema = z.object({
    id: z.string(),
    name: z.string(),
    status: z.enum(["healthy", "degraded", "critical", "unknown"]),
    uptime: z.number(),
    latency: z.number(),
    errorRate: z.number(),
    requestsPerSecond: z.number(),
    version: z.string().optional(),
});

export const serviceStatusGridSchema = z.object({
    services: z.array(serviceSchema),
    title: z.string().optional(),
});

type ServiceStatusGridProps = z.infer<typeof serviceStatusGridSchema>;

function ServiceTerminalCard({ service, index }: { service: z.infer<typeof serviceSchema>; index: number }) {
    const isError = service.status === 'critical' || service.status === 'degraded';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.03 }}
            className={`font-mono border p-3 bg-black/40 relative overflow-hidden ${service.status === 'critical' ? 'border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                    service.status === 'degraded' ? 'border-amber-500/50' : 'border-cyan-500/20'
                }`}
        >
            {/* Background scanner line for active cards */}
            {service.status === 'healthy' && (
                <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-500/10 animate-[scanline_4s_linear_infinite]" />
            )}

            <div className="flex items-start justify-between mb-3">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">service_unit:</span>
                    <span className={`text-xs font-bold ${isError ? 'text-red-400' : 'text-cyan-400'}`}>
                        {service.name.toUpperCase()}
                    </span>
                </div>
                <div className={`text-[10px] px-1.5 py-0.5 border ${service.status === 'healthy' ? 'border-green-500/40 text-green-500' :
                        service.status === 'critical' ? 'border-red-500 text-red-500 bg-red-500/10' :
                            'border-amber-500 text-amber-500'
                    }`}>
                    {service.status.toUpperCase()}
                </div>
            </div>

            <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between items-center text-gray-400">
                    <span>UPTIME</span>
                    <span className={service.uptime < 99.9 ? 'text-amber-400' : 'text-cyan-500'}>{service.uptime.toFixed(3)}%</span>
                </div>
                <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${service.uptime}%` }}
                        className={`h-full ${service.uptime < 99.9 ? 'bg-amber-500' : 'bg-cyan-500'}`}
                    />
                </div>
                <div className="flex justify-between text-gray-500">
                    <span>LATENCY</span>
                    <span className="text-gray-300">{service.latency}ms</span>
                </div>
                <div className="flex justify-between text-gray-500">
                    <span>ERROR_RT</span>
                    <span className={service.errorRate > 1 ? 'text-red-500' : 'text-gray-300'}>{service.errorRate}%</span>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[8px] text-gray-600">
                <span className="font-mono">{service.version || 'v1.0.0'}</span>
                <span className="flex items-center gap-1">
                    <Activity className="w-2 h-2" />
                    {service.requestsPerSecond} RPS
                </span>
            </div>
        </motion.div>
    );
}

export function ServiceStatusGrid(props: ServiceStatusGridProps) {
    const { services = [], title = "SERVICE_MATRIX_OVERVIEW" } = props || {};

    return (
        <div className="space-y-4 font-mono">
            <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{title}</span>
                </div>
                <div className="text-[10px] text-gray-500">MONITORING {services.length} NODES</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((service, index) => (
                    <ServiceTerminalCard key={service.id} service={service} index={index} />
                ))}
            </div>
        </div>
    );
}

export const serviceStatusGridComponent: TamboComponent = {
    name: "ServiceStatusGrid",
    description: "Terminal-style service health monitor grid.",
    component: ServiceStatusGrid,
    propsSchema: serviceStatusGridSchema,
};
