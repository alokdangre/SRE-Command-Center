"use client";

/**
 * Remediation Panel - Interactable Component
 * AI can update this component's props to suggest and toggle remediation actions
 */

import { withInteractable } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    RotateCcw,
    Scale,
    Shield,
    Globe,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Play,
    Loader2,
} from "lucide-react";

const remediationActionSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.enum(["automatic", "manual"]),
    risk: z.enum(["low", "medium", "high"]),
    enabled: z.boolean(),
    status: z.enum(["idle", "running", "completed", "failed"]).optional(),
});

const remediationPanelSchema = z.object({
    incidentId: z.string(),
    safeModeEnabled: z.boolean(),
    trafficShiftingEnabled: z.boolean(),
    trafficShiftPercentage: z.number().min(0).max(100),
    recommendedAction: z.string().optional(),
    actions: z.array(remediationActionSchema),
});

type RemediationPanelProps = z.infer<typeof remediationPanelSchema>;

const getActionIcon = (actionId: string) => {
    if (actionId.includes("rollback")) return RotateCcw;
    if (actionId.includes("scale")) return Scale;
    if (actionId.includes("safe")) return Shield;
    if (actionId.includes("traffic")) return Globe;
    return RefreshCw;
};

const getRiskStyles = (risk: string) => {
    switch (risk) {
        case "low":
            return { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/30" };
        case "medium":
            return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
        case "high":
            return { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30" };
        default:
            return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/30" };
    }
};

function RemediationPanelBase(props: RemediationPanelProps) {
    const [state, setState] = useState<RemediationPanelProps>(props);
    const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
    const prevPropsRef = useRef<RemediationPanelProps>(props);

    // Track props changes from Tambo AI
    useEffect(() => {
        const prevProps = prevPropsRef.current;
        const changedFields = new Set<string>();

        if (props.safeModeEnabled !== prevProps.safeModeEnabled) {
            changedFields.add("safeModeEnabled");
        }
        if (props.trafficShiftingEnabled !== prevProps.trafficShiftingEnabled) {
            changedFields.add("trafficShiftingEnabled");
        }
        if (props.trafficShiftPercentage !== prevProps.trafficShiftPercentage) {
            changedFields.add("trafficShiftPercentage");
        }
        if (props.recommendedAction !== prevProps.recommendedAction) {
            changedFields.add("recommendedAction");
        }

        // Check action changes
        props.actions.forEach((action, idx) => {
            const prevAction = prevProps.actions[idx];
            if (prevAction && action.enabled !== prevAction.enabled) {
                changedFields.add(`action-${action.id}`);
            }
            if (prevAction && action.status !== prevAction.status) {
                changedFields.add(`action-status-${action.id}`);
            }
        });

        setState(props);
        prevPropsRef.current = props;

        if (changedFields.size > 0) {
            setUpdatedFields(changedFields);
            const timer = setTimeout(() => setUpdatedFields(new Set()), 1500);
            return () => clearTimeout(timer);
        }
    }, [props]);

    const handleToggle = (field: keyof RemediationPanelProps, value: boolean) => {
        setState((prev) => ({ ...prev, [field]: value }));
    };

    const handleSliderChange = (value: number) => {
        setState((prev) => ({ ...prev, trafficShiftPercentage: value }));
    };

    const handleActionToggle = (actionId: string, enabled: boolean) => {
        setState((prev) => ({
            ...prev,
            actions: prev.actions.map((a) =>
                a.id === actionId ? { ...a, enabled } : a
            ),
        }));
    };

    const executeAction = (actionId: string) => {
        setState((prev) => ({
            ...prev,
            actions: prev.actions.map((a) =>
                a.id === actionId ? { ...a, status: "running" } : a
            ),
        }));

        // Simulate execution
        setTimeout(() => {
            setState((prev) => ({
                ...prev,
                actions: prev.actions.map((a) =>
                    a.id === actionId ? { ...a, status: "completed" } : a
                ),
            }));
        }, 3000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600/20 to-purple-600/20 px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Remediation Panel</h3>
                        <p className="text-sm text-gray-400">Incident #{state.incidentId}</p>
                    </div>
                    {state.recommendedAction && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 ${updatedFields.has("recommendedAction") ? "animate-pulse ring-2 ring-amber-500" : ""
                                }`}
                        >
                            <AlertTriangle className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-medium text-amber-300">
                                Recommended: {state.recommendedAction}
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Quick Controls */}
            <div className="p-6 border-b border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-4">Quick Controls</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Safe Mode Toggle */}
                    <motion.div
                        className={`bg-gray-800/50 rounded-lg p-4 border transition-all ${updatedFields.has("safeModeEnabled")
                                ? "border-purple-500 ring-2 ring-purple-500/50"
                                : "border-gray-700"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Shield className={`w-5 h-5 ${state.safeModeEnabled ? "text-purple-400" : "text-gray-500"}`} />
                                <span className="font-medium text-white">Safe Mode</span>
                            </div>
                            <button
                                onClick={() => handleToggle("safeModeEnabled", !state.safeModeEnabled)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${state.safeModeEnabled ? "bg-purple-600" : "bg-gray-600"
                                    }`}
                            >
                                <motion.div
                                    layout
                                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                                    style={{ left: state.safeModeEnabled ? "calc(100% - 22px)" : "2px" }}
                                />
                            </button>
                        </div>
                        <p className="text-xs text-gray-400">
                            Reduces non-essential features, prioritizes core functionality
                        </p>
                    </motion.div>

                    {/* Traffic Shifting */}
                    <motion.div
                        className={`bg-gray-800/50 rounded-lg p-4 border transition-all ${updatedFields.has("trafficShiftingEnabled") || updatedFields.has("trafficShiftPercentage")
                                ? "border-blue-500 ring-2 ring-blue-500/50"
                                : "border-gray-700"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Globe className={`w-5 h-5 ${state.trafficShiftingEnabled ? "text-blue-400" : "text-gray-500"}`} />
                                <span className="font-medium text-white">Traffic Shifting</span>
                            </div>
                            <button
                                onClick={() => handleToggle("trafficShiftingEnabled", !state.trafficShiftingEnabled)}
                                className={`relative w-12 h-6 rounded-full transition-colors ${state.trafficShiftingEnabled ? "bg-blue-600" : "bg-gray-600"
                                    }`}
                            >
                                <motion.div
                                    layout
                                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                                    style={{ left: state.trafficShiftingEnabled ? "calc(100% - 22px)" : "2px" }}
                                />
                            </button>
                        </div>
                        {state.trafficShiftingEnabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3"
                            >
                                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                                    <span>Shift to backup region</span>
                                    <span className="font-mono text-blue-400">{state.trafficShiftPercentage}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={state.trafficShiftPercentage}
                                    onChange={(e) => handleSliderChange(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                />
                            </motion.div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Remediation Actions */}
            <div className="p-6">
                <h4 className="text-sm font-medium text-gray-300 mb-4">Available Actions</h4>
                <div className="space-y-3">
                    <AnimatePresence>
                        {state.actions.map((action) => {
                            const Icon = getActionIcon(action.id);
                            const riskStyle = getRiskStyles(action.risk);
                            const isHighlighted = updatedFields.has(`action-${action.id}`);
                            const statusChanged = updatedFields.has(`action-status-${action.id}`);

                            return (
                                <motion.div
                                    key={action.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`bg-gray-800/50 rounded-lg p-4 border transition-all ${isHighlighted || statusChanged
                                            ? "border-cyan-500 ring-2 ring-cyan-500/50"
                                            : "border-gray-700"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 rounded-lg ${riskStyle.bg} ${riskStyle.border} border`}>
                                            <Icon className={`w-5 h-5 ${riskStyle.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-white">{action.name}</span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${riskStyle.bg} ${riskStyle.text}`}>
                                                    {action.risk} risk
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                                                    {action.type}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400">{action.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {action.status === "running" ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <Loader2 className="w-5 h-5 text-blue-400" />
                                                </motion.div>
                                            ) : action.status === "completed" ? (
                                                <CheckCircle className="w-5 h-5 text-green-400" />
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleActionToggle(action.id, !action.enabled)}
                                                        className={`w-10 h-6 rounded-full transition-colors ${action.enabled ? "bg-green-600" : "bg-gray-600"
                                                            }`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className="w-4 h-4 bg-white rounded-full shadow-md mx-1"
                                                            style={{ marginLeft: action.enabled ? "auto" : "4px", marginRight: action.enabled ? "4px" : "auto" }}
                                                        />
                                                    </button>
                                                    {action.enabled && (
                                                        <motion.button
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            onClick={() => executeAction(action.id)}
                                                            className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors"
                                                        >
                                                            <Play className="w-4 h-4 text-white" />
                                                        </motion.button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-6 py-3 bg-gray-800/50 border-t border-gray-700">
                <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        AI suggestions active
                    </span>
                </div>
            </div>
        </motion.div>
    );
}

// Create the interactable component
export const InteractableRemediationPanel = withInteractable(RemediationPanelBase, {
    componentName: "RemediationPanel",
    description: "A remediation control panel that allows toggling Safe Mode, Traffic Shifting, and various remediation actions. The AI can update props to enable/disable features and suggest actions for incident response.",
    propsSchema: remediationPanelSchema,
});

// Export for use in pages
export function RemediationPanel({
    incidentId,
    initialSafeMode = false,
    initialTrafficShifting = false,
    initialTrafficPercentage = 0,
}: {
    incidentId: string;
    initialSafeMode?: boolean;
    initialTrafficShifting?: boolean;
    initialTrafficPercentage?: number;
}) {
    return (
        <InteractableRemediationPanel
            incidentId={incidentId}
            safeModeEnabled={initialSafeMode}
            trafficShiftingEnabled={initialTrafficShifting}
            trafficShiftPercentage={initialTrafficPercentage}
            actions={[
                {
                    id: "rem-rollback",
                    name: "Rollback Deployment",
                    description: "Rollback to previous stable version (v1.9.2)",
                    type: "automatic",
                    risk: "medium",
                    enabled: false,
                },
                {
                    id: "rem-scale",
                    name: "Scale Horizontal",
                    description: "Add 5 additional pods to handle load",
                    type: "automatic",
                    risk: "low",
                    enabled: false,
                },
                {
                    id: "rem-restart",
                    name: "Restart Service Pods",
                    description: "Perform rolling restart of all pods",
                    type: "automatic",
                    risk: "low",
                    enabled: false,
                },
            ]}
            onPropsUpdate={(newProps) => {
                console.log("Remediation panel updated by AI:", newProps);
            }}
        />
    );
}
