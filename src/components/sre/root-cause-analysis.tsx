"use client";

import type { TamboComponent } from "@tambo-ai/react";
import { z } from "zod";
import { motion } from "framer-motion";
import { Brain, Activity, Target, Zap, GitCommit, ChevronRight } from "lucide-react";

export const rootCauseAnalysisSchema = z.object({
    suspectedCause: z.string(),
    confidence: z.number().min(0).max(100),
    evidence: z.array(z.string()),
    recommendedAction: z.string(),
    relatedCommits: z.array(z.object({
        sha: z.string(),
        message: z.string(),
        author: z.string(),
    })).optional(),
    slackInsights: z.array(z.string()).optional(),
});

type RootCauseAnalysisProps = z.infer<typeof rootCauseAnalysisSchema>;

export function RootCauseAnalysis(props: RootCauseAnalysisProps) {
    const {
        suspectedCause = "ANALYZING_DATASET...",
        confidence = 0,
        evidence = [],
        recommendedAction = "AWAITING_INSTRUCTION...",
        relatedCommits = [],
    } = props || {};

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="terminal-window border-cyan-500/30 bg-black p-0 font-mono text-sm overflow-hidden"
        >
            {/* HUD Header */}
            <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-cyan-400 tracking-widest uppercase text-xs">AI_ROOT_CAUSE_ANALYSIS</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-500">CONFIDENCE_LEVEL</span>
                        <span className={`text-lg font-bold leading-none ${confidence > 80 ? 'text-green-500' : 'text-amber-500'}`}>
                            {confidence}%
                        </span>
                    </div>
                </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Findings */}
                <div className="space-y-6">
                    <section>
                        <h4 className="text-[10px] text-cyan-500/70 uppercase mb-2 flex items-center gap-2">
                            <Target className="w-3 h-3" /> SUSPECTED_CAUSE
                        </h4>
                        <div className="p-4 border border-cyan-500/20 bg-cyan-500/5 terminal-flicker">
                            <p className="text-white font-medium leading-relaxed">{suspectedCause}</p>
                        </div>
                    </section>

                    <section>
                        <h4 className="text-[10px] text-cyan-500/70 uppercase mb-3 flex items-center gap-2">
                            <Activity className="w-3 h-3" /> TELEMETRY_EVIDENCE
                        </h4>
                        <ul className="space-y-2">
                            {evidence.map((item, i) => (
                                <li key={i} className="flex gap-2 text-xs text-gray-400">
                                    <span className="text-cyan-500">[-]</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>

                {/* Right Side: Remediation & Insights */}
                <div className="space-y-6">
                    <section>
                        <h4 className="text-[10px] text-amber-500/70 uppercase mb-2 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> RECOVERY_PLAN
                        </h4>
                        <div className="p-4 border border-amber-500/20 bg-amber-500/5 text-amber-100 text-xs">
                            <div className="flex gap-2 items-start">
                                <ChevronRight className="w-3 h-3 mt-0.5" />
                                {recommendedAction}
                            </div>
                        </div>
                    </section>

                    {relatedCommits.length > 0 && (
                        <section>
                            <h4 className="text-[10px] text-purple-500/70 uppercase mb-3 flex items-center gap-2">
                                <GitCommit className="w-3 h-3" /> SUSPICIOUS_CODE_CHANGES
                            </h4>
                            <div className="space-y-2">
                                {relatedCommits.map((commit, i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 p-2 rounded flex justify-between items-center">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-300 truncate w-[200px]">{commit.message}</span>
                                            <span className="text-[8px] text-gray-600 uppercase font-bold">{commit.author}</span>
                                        </div>
                                        <code className="text-[10px] text-purple-400 bg-purple-400/10 px-1 rounded">{commit.sha.slice(0, 7)}</code>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <div className="bg-cyan-500/5 border-t border-cyan-500/10 px-6 py-2">
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                    <span className="animate-pulse">●</span>
                    <span>NEURAL_ENGINE_STATUS: NOMINAL</span>
                    <span className="ml-auto">PROCESS_ID: RCA_LIVE</span>
                </div>
            </div>
        </motion.div>
    );
}

export const rootCauseAnalysisComponent: TamboComponent = {
    name: "RootCauseAnalysis",
    description: "Terminal-style AI root cause analysis display.",
    component: RootCauseAnalysis,
    propsSchema: rootCauseAnalysisSchema,
};
