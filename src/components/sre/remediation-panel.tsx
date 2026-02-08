"use client";

/**
 * Remediation Panel - Interactable Component
 * AI can update this component's props to suggest and toggle remediation actions
 */

import type { TamboComponent } from "@tambo-ai/react";
import { withInteractable, useTambo } from "@tambo-ai/react";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import {
    Zap,
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

export const remediationPanelSchema = z.object({
    incidentId: z.string(),
    safeModeEnabled: z.boolean(),
    trafficShiftingEnabled: z.boolean(),
    trafficShiftPercentage: z.number().min(0).max(100),
    recommendedAction: z.string().optional(),
    actions: z.array(remediationActionSchema),
});

type RemediationPanelProps = z.infer<typeof remediationPanelSchema>;

function normalizeRemediationProps(input: Partial<RemediationPanelProps> | undefined): RemediationPanelProps {
    const actions = Array.isArray(input?.actions) ? input.actions : [];

    return {
        incidentId: input?.incidentId || "active-incident",
        safeModeEnabled: Boolean(input?.safeModeEnabled),
        trafficShiftingEnabled: Boolean(input?.trafficShiftingEnabled),
        trafficShiftPercentage: Math.max(0, Math.min(100, Number(input?.trafficShiftPercentage ?? 0))),
        recommendedAction: input?.recommendedAction,
        actions: actions.map((action, index) => ({
            id: action?.id || `action-${index}`,
            name: action?.name || "Unnamed Action",
            description: action?.description || "No description provided.",
            type: action?.type || "manual",
            risk: action?.risk || "medium",
            enabled: Boolean(action?.enabled),
            status: action?.status,
        })),
    };
}

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
    const { sendThreadMessage, thread, isIdle } = useTambo();
    const [state, setState] = useState<RemediationPanelProps>(() => normalizeRemediationProps(props));
    const [updatedFields, setUpdatedFields] = useState<Set<string>>(new Set());
    const [executingActionId, setExecutingActionId] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string>("--:--:--");
    const prevPropsRef = useRef<RemediationPanelProps>(normalizeRemediationProps(props));

    // Track props changes from Tambo AI
    useEffect(() => {
        const normalizedProps = normalizeRemediationProps(props);
        const prevProps = prevPropsRef.current;
        const changedFields = new Set<string>();

        if (normalizedProps.safeModeEnabled !== prevProps.safeModeEnabled) {
            changedFields.add("safeModeEnabled");
        }
        if (normalizedProps.trafficShiftingEnabled !== prevProps.trafficShiftingEnabled) {
            changedFields.add("trafficShiftingEnabled");
        }
        if (normalizedProps.trafficShiftPercentage !== prevProps.trafficShiftPercentage) {
            changedFields.add("trafficShiftPercentage");
        }
        if (normalizedProps.recommendedAction !== prevProps.recommendedAction) {
            changedFields.add("recommendedAction");
        }

        // Check action changes
        normalizedProps.actions.forEach((action, idx) => {
            const prevAction = prevProps.actions?.[idx];
            if (prevAction && action.enabled !== prevAction.enabled) {
                changedFields.add(`action-${action.id}`);
            }
            if (prevAction && action.status !== prevAction.status) {
                changedFields.add(`action-status-${action.id}`);
            }
        });

        setState(normalizedProps);
        prevPropsRef.current = normalizedProps;
        setLastUpdated(new Date().toLocaleTimeString());

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

    const executeAction = async (actionId: string) => {
        if (!isIdle || executingActionId) return;
        if (!thread?.id) return;

        setExecutingActionId(actionId);
        try {
            await sendThreadMessage(
                `Execute remediation action "${actionId}". Use tool executeRemediation and report the result clearly.`,
                {
                    threadId: thread.id,
                    streamResponse: true,
                }
            );
        } catch (error) {
            console.error("Failed to execute remediation action via tool:", error);
        } finally {
            setExecutingActionId(null);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/80 border border-cyan-500/20 relative overflow-hidden font-mono"
        >
            {/* Scanline overlay for the panel */}
            <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-10 opacity-30" />

            {/* Header */}
            <div className="bg-cyan-500/10 px-6 py-3 border-b border-cyan-500/20 relative z-20">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-[10px] text-cyan-500/50 uppercase tracking-widest mb-1">MODULE {"//"} REMEDIATION_ENG</div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Zap className="w-4 h-4 text-cyan-500" />
                            INCIDENT_CONTROL_PANEL
                        </h3>
                    </div>
                    {state.recommendedAction && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 ${updatedFields.has("recommendedAction") ? "animate-pulse ring-1 ring-amber-500" : ""
                                }`}
                        >
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-bold text-amber-500 uppercase">
                                SUGGESTED: {state.recommendedAction.toUpperCase()}
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Quick Controls */}
            <div className="p-6 border-b border-cyan-500/10 relative z-20">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">SYSTEM_POLICIES {"//"} QUICK_MODE</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Safe Mode Toggle */}
                    <motion.div
                        className={`bg-black/40 p-4 border transition-all ${updatedFields.has("safeModeEnabled")
                            ? "border-cyan-500 bg-cyan-500/5"
                            : "border-gray-800"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Shield className={`w-4 h-4 ${state.safeModeEnabled ? "text-cyan-400" : "text-gray-600"}`} />
                                <span className="text-xs font-bold text-gray-300 uppercase">Safe_Mode</span>
                            </div>
                            <button
                                onClick={() => handleToggle("safeModeEnabled", !state.safeModeEnabled)}
                                className={`relative w-10 h-5 border transition-colors ${state.safeModeEnabled ? "border-cyan-500 bg-cyan-500/20" : "border-gray-700 bg-gray-900"
                                    }`}
                            >
                                <motion.div
                                    layout
                                    className={`absolute top-0.5 w-3.5 h-3.5 ${state.safeModeEnabled ? "bg-cyan-500" : "bg-gray-600"}`}
                                    style={{ left: state.safeModeEnabled ? "calc(100% - 18px)" : "4px" }}
                                />
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-500 uppercase leading-relaxed">
                            THROTTLE_NON_ESSENTIAL // PRIORITIZE_CORE_STK
                        </p>
                    </motion.div>

                    {/* Traffic Shifting */}
                    <motion.div
                        className={`bg-black/40 p-4 border transition-all ${updatedFields.has("trafficShiftingEnabled") || updatedFields.has("trafficShiftPercentage")
                            ? "border-amber-500 bg-amber-500/5"
                            : "border-gray-800"
                            }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Globe className={`w-4 h-4 ${state.trafficShiftingEnabled ? "text-amber-400" : "text-gray-600"}`} />
                                <span className="text-xs font-bold text-gray-300 uppercase">Traffic_Shift</span>
                            </div>
                            <button
                                onClick={() => handleToggle("trafficShiftingEnabled", !state.trafficShiftingEnabled)}
                                className={`relative w-10 h-5 border transition-colors ${state.trafficShiftingEnabled ? "border-amber-500 bg-amber-500/20" : "border-gray-700 bg-gray-900"
                                    }`}
                            >
                                <motion.div
                                    layout
                                    className={`absolute top-0.5 w-3.5 h-3.5 ${state.trafficShiftingEnabled ? "bg-amber-500" : "bg-gray-600"}`}
                                    style={{ left: state.trafficShiftingEnabled ? "calc(100% - 18px)" : "4px" }}
                                />
                            </button>
                        </div>
                        {state.trafficShiftingEnabled ? (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3"
                            >
                                <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                                    <span className="uppercase">BACKUP_RGN_LVL</span>
                                    <span className="font-mono text-amber-500 font-bold">{state.trafficShiftPercentage}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={state.trafficShiftPercentage}
                                    onChange={(e) => handleSliderChange(Number(e.target.value))}
                                    className="w-full h-1 bg-gray-800 appearance-none cursor-pointer accent-amber-500"
                                />
                            </motion.div>
                        ) : (
                            <p className="text-[10px] text-gray-500 uppercase leading-relaxed">
                                REROUTE_INGRESS // FAILOVER_ENABLED: FALSE
                            </p>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* Remediation Actions */}
            <div className="p-6 relative z-20">
                <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">ACTION_SEQUENCE {"//"} AVAILABLE</div>
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
                                    className={`bg-black/60 p-4 border transition-all ${isHighlighted || statusChanged
                                        ? "border-cyan-500 ring-1 ring-cyan-500/30"
                                        : "border-gray-800 hover:border-cyan-500/20"
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2 border ${riskStyle.border} ${riskStyle.bg}`}>
                                            <Icon className={`w-4 h-4 ${riskStyle.text}`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-gray-200 uppercase tracking-tight">{action.name}</span>
                                                <span className={`text-[8px] px-1.5 py-0.5 border font-bold uppercase ${riskStyle.border} ${riskStyle.text} ${riskStyle.bg}`}>
                                                    {action.risk}_RISK
                                                </span>
                                                <span className="text-[8px] px-1.5 py-0.5 border border-gray-700 text-gray-500 uppercase font-bold">
                                                    {action.type}
                                                </span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{action.description}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {action.status === "running" || executingActionId === action.id ? (
                                                <div className="flex items-center gap-2">
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                    >
                                                        <Loader2 className="w-4 h-4 text-cyan-400" />
                                                    </motion.div>
                                                    <span className="text-[10px] text-cyan-500 font-bold animate-pulse">RUNNING</span>
                                                </div>
                                            ) : action.status === "completed" ? (
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                                    <span className="text-[10px] text-green-500 font-bold">DONE</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleActionToggle(action.id, !action.enabled)}
                                                        className={`relative w-8 h-4 border transition-colors ${action.enabled ? "border-green-500 bg-green-500/20" : "border-gray-700 bg-gray-900"
                                                            }`}
                                                    >
                                                        <motion.div
                                                            layout
                                                            className={`absolute top-0.5 w-2.5 h-2.5 ${action.enabled ? "bg-green-500" : "bg-gray-600"}`}
                                                            style={{ left: action.enabled ? "calc(100% - 13px)" : "3px" }}
                                                        />
                                                    </button>
                                                    {action.enabled && (
                                                        <motion.button
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            onClick={() => void executeAction(action.id)}
                                                            className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 transition-colors uppercase text-[10px] font-bold text-black border-b-2 border-cyan-800 active:border-b-0 active:translate-y-[1px]"
                                                            disabled={!isIdle || !!executingActionId}
                                                        >
                                                            RUN_CMD
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
            <div className="px-6 py-2 bg-cyan-500/5 border-t border-cyan-500/10 relative z-20">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-gray-500">
                    <span className="flex items-center gap-2">
                        <span className="text-cyan-500/50">TIMESTAMP_REF:</span>
                        {lastUpdated}
                    </span>
                    <span className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        AI_SUGGESTIONS: ACTIVE
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

export const remediationPanelComponent: TamboComponent = {
    name: "RemediationPanel",
    description:
        "Interactable remediation control panel for incident response actions including restart, scale, rollback, and safety toggles.",
    component: InteractableRemediationPanel,
    propsSchema: remediationPanelSchema,
};

// Export for use in pages
export function RemediationPanel({
    incidentId,
    initialSafeMode = false,
    initialTrafficShifting = false,
    initialTrafficPercentage = 0,
    initialActions = [],
}: {
    incidentId: string;
    initialSafeMode?: boolean;
    initialTrafficShifting?: boolean;
    initialTrafficPercentage?: number;
    initialActions?: RemediationPanelProps["actions"];
}) {
    return (
        <InteractableRemediationPanel
            incidentId={incidentId}
            safeModeEnabled={initialSafeMode}
            trafficShiftingEnabled={initialTrafficShifting}
            trafficShiftPercentage={initialTrafficPercentage}
            actions={initialActions}
            onPropsUpdate={(newProps) => {
                console.log("Remediation panel updated by AI:", newProps);
            }}
        />
    );
}
