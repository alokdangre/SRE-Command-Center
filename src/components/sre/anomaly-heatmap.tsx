"use client";

/**
 * Anomaly Heatmap Component - Generative UI
 * Displays a heatmap of service anomalies over time
 */

import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { motion } from "framer-motion";

const anomalyDataSchema = z.object({
    service: z.string(),
    anomalies: z.array(z.object({
        time: z.string(),
        score: z.number(),
    })),
});

export const anomalyHeatmapSchema = z.object({
    title: z.string().optional(),
    data: z.array(anomalyDataSchema),
    timeLabels: z.array(z.string()).optional(),
});

type AnomalyHeatmapProps = z.infer<typeof anomalyHeatmapSchema>;

function getHeatmapColor(score: number): string {
    if (score >= 80) return "bg-red-500";
    if (score >= 60) return "bg-orange-500";
    if (score >= 40) return "bg-amber-500";
    if (score >= 20) return "bg-yellow-400";
    if (score >= 10) return "bg-green-400";
    return "bg-green-600";
}

function getHeatmapOpacity(score: number): number {
    if (score >= 80) return 1;
    if (score >= 60) return 0.9;
    if (score >= 40) return 0.7;
    if (score >= 20) return 0.5;
    return 0.3;
}

export function AnomalyHeatmap(props: AnomalyHeatmapProps) {
    const { title = "Service Anomaly Heatmap", data = [], timeLabels = [] } = props || {};

    const defaultTimeLabels = ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"];
    const labels = timeLabels || defaultTimeLabels;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700"
        >
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                    {title || "Service Anomaly Heatmap"}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-green-600 rounded" /> Normal
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-amber-500 rounded" /> Warning
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-red-500 rounded" /> Critical
                    </span>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr>
                            <th className="text-left text-xs font-medium text-gray-400 pb-3 pr-4 min-w-[120px]">
                                Service
                            </th>
                            {labels.map((time) => (
                                <th key={time} className="text-center text-xs font-medium text-gray-400 pb-3 px-1 min-w-[50px]">
                                    {time}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => (
                            <motion.tr
                                key={row.service}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: rowIndex * 0.05 }}
                            >
                                <td className="text-sm text-gray-300 py-1 pr-4 font-medium">
                                    {row.service}
                                </td>
                                {row.anomalies.map((cell, cellIndex) => (
                                    <td key={cellIndex} className="p-1">
                                        <motion.div
                                            whileHover={{ scale: 1.2 }}
                                            className={`w-full h-8 rounded ${getHeatmapColor(cell.score)} cursor-pointer transition-all relative group`}
                                            style={{ opacity: getHeatmapOpacity(cell.score) }}
                                            title={`${row.service} at ${cell.time}: ${cell.score.toFixed(1)}% anomaly score`}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                                <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap border border-gray-700 shadow-lg">
                                                    <div className="font-medium">{row.service}</div>
                                                    <div className="text-gray-400">{cell.time}</div>
                                                    <div className={`font-bold ${cell.score >= 60 ? 'text-red-400' : cell.score >= 30 ? 'text-amber-400' : 'text-green-400'}`}>
                                                        {cell.score.toFixed(1)}% anomaly
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </td>
                                ))}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                        {data.length} services monitored
                    </span>
                    <span className="text-gray-400">
                        {data.reduce((acc, row) => acc + row.anomalies.filter(a => a.score >= 60).length, 0)} critical anomalies detected
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

export const anomalyHeatmapComponent: TamboComponent = {
    name: "AnomalyHeatmap",
    description: "Displays a heatmap visualization of service anomalies over time. Each cell shows the anomaly score for a service at a specific time, with colors ranging from green (normal) to red (critical).",
    component: AnomalyHeatmap,
    propsSchema: anomalyHeatmapSchema,
};
