"use client";

/**
 * SRE Command Center - Terminal Dashboard
 * High-performance incident response platform with terminal aesthetics
 */

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { TamboProviderWithAuth } from "@/components/auth/tambo-provider-with-auth";
import {
    MessageInput,
    MessageInputSubmitButton,
    MessageInputTextarea,
    MessageInputToolbar,
} from "@/components/tambo/message-input";
import { ScrollableMessageContainer } from "@/components/tambo/scrollable-message-container";
import {
    ThreadContent,
    ThreadContentMessages,
} from "@/components/tambo/thread-content";
import { ThreadPersistence } from "@/components/tambo/thread-persistence";
import { TamboRuntimeContext } from "@/components/tambo/tambo-runtime-context";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { components, tools } from "@/lib/tambo";
import { RemediationPanel } from "@/components/sre/remediation-panel";
import { SuggestedActions } from "@/components/sre/suggested-actions";
import { AsciiLogo, AsciiStatus } from "@/components/sre/ascii-art";
import { UserNav } from "@/components/auth/user-nav";
import { motion, AnimatePresence } from "framer-motion";
import {
    AlertTriangle,
    Shield,
    ChevronLeft,
    ChevronRight,
    Zap,
    Terminal,
    Cpu,
    Database,
    Settings,
} from "lucide-react";
import Link from "next/link";

const DictationButton = dynamic(() => import("@/components/tambo/dictation-button"), {
    ssr: false,
});

function TerminalHeader() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-black/80 border-b border-cyan-500/30 px-6 py-2 flex items-center justify-between font-mono text-xs relative z-50">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-cyan-400 font-bold uppercase tracking-widest">SRE_OS v2.0.4</span>
                </div>
                <div className="h-4 w-px bg-gray-800" />
                <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        CPU: 42%
                    </span>
                    <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        MEM: 68%
                    </span>
                    <span className="flex items-center gap-1 text-green-500">
                        <Shield className="w-3 h-3" />
                        SEC: ACTIVE
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Link
                    href="/settings"
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                    title="Settings & Integrations"
                >
                    <Settings className="w-4 h-4 text-gray-400 hover:text-cyan-400" />
                </Link>
                <UserNav />
                <span className="text-cyan-500/70 hidden sm:inline">SESSION: 0xc4ffde21</span>
                <span className="text-white bg-gray-900 px-2 py-0.5 rounded border border-gray-800">
                    {time.toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
}

export default function SRECommandCenter() {
    const [isChatOpen, setIsChatOpen] = useState(true);
    const mcpServers = useMcpServers();

    return (
        <TamboProviderWithAuth
            components={components}
            tools={tools}
            mcpServers={mcpServers}
        >
            <ThreadPersistence />
            <TamboRuntimeContext incidentId="inc-2024-001" isChatOpen={isChatOpen} />
            <div className="flex flex-col h-screen bg-black text-white selection:bg-cyan-500/30 font-mono">
                {/* Scanline Effect */}
                <div className="scanline" />

                <TerminalHeader />

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content Area */}
                    <div className="flex-1 overflow-auto p-6 scrollbar-hide text-sm">
                        <div className="max-w-5xl mx-auto space-y-8">

                            {/* Hero / HUD Section */}
                            <div className="flex flex-col md:flex-row gap-8 items-start justify-between border-b border-cyan-500/10 pb-8">
                                <div className="flex-1">
                                    <AsciiLogo />
                                    <div className="mt-4 p-4 border border-cyan-500/20 bg-cyan-500/5 rounded-lg terminal-flicker">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                                            <span className="text-red-500 font-bold">CRITICAL_ALERT (ID: 40291)</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed max-w-2xl">
                                            NOTIFICATION_SERVICE is throwing 5xx errors in us-east-1.
                                            Latency is spiking to &gt;2s. Memory pressure detected on node cluster-04.
                                        </p>
                                        <div className="mt-4 flex gap-4 text-xs">
                                            <span className="text-cyan-400">status: investigating</span>
                                            <span className="text-gray-500">|</span>
                                            <span className="text-cyan-400">impact: high</span>
                                            <span className="text-gray-500">|</span>
                                            <span className="text-cyan-400">ETA: 14m</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto">
                                    <AsciiStatus />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 border border-green-500/20 rounded bg-green-500/5">
                                            <div className="text-[10px] text-green-500/70 uppercase">Uptime</div>
                                            <div className="text-xl font-bold text-green-500">99.992%</div>
                                        </div>
                                        <div className="p-3 border border-red-500/20 rounded bg-red-500/5">
                                            <div className="text-[10px] text-red-500/70 uppercase">Errors (H)</div>
                                            <div className="text-xl font-bold text-red-500">12.4%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Remediation HUD */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-cyan-500 uppercase tracking-widest text-xs font-bold">
                                    <Zap className="w-4 h-4" />
                                    Remediation_Controls
                                </div>
                                <RemediationPanel
                                    incidentId="inc-2024-001"
                                    initialSafeMode={false}
                                    initialTrafficShifting={false}
                                    initialTrafficPercentage={0}
                                />
                            </div>

                            {/* Operational Log Mock */}
                            <div className="p-4 border border-gray-800 rounded bg-gray-900/20 font-mono text-xs text-gray-500 space-y-1">
                                <div>[14:20:01] INFO: Initializing SRE_CMD_CTR...</div>
                                <div>[14:20:03] WARN: Anomaly detected in Notification Service</div>
                                <div>[14:20:05] INFO: AI Assistant ready for deployment metadata analysis</div>
                                <div className="text-cyan-500/50">[14:22:48] READY: Waiting for user command_</div>
                            </div>
                        </div>
                    </div>

                    {/* AI Chat Sidebar - Console Style */}
                    <AnimatePresence>
                        <motion.div
                            initial={false}
                            animate={{ width: isChatOpen ? 500 : 0 }}
                            className="border-l border-cyan-500/20 bg-black/40 backdrop-blur-xl flex flex-col relative overflow-hidden"
                        >
                            {isChatOpen && (
                                <>
                                    {/* Console Header */}
                                    <div className="p-4 border-b border-cyan-500/20 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                                            <span className="text-xs font-bold text-cyan-500 uppercase">AI_CONS_01</span>
                                        </div>
                                        <div className="flex gap-1">
                                            <div className="w-3 h-1 bg-cyan-500/30" />
                                            <div className="w-3 h-1 bg-cyan-500/30" />
                                            <div className="w-3 h-1 bg-cyan-500" />
                                        </div>
                                    </div>

                                    {/* Console Output */}
                                    <ScrollableMessageContainer className="flex-1 p-2">
                                        <ThreadContent variant="default">
                                            <ThreadContentMessages />
                                        </ThreadContent>
                                    </ScrollableMessageContainer>

                                    <SuggestedActions />

                                    {/* Command Entry */}
                                    <div className="p-4 border-t border-cyan-500/20 bg-black">
                                        <div className="text-[10px] text-gray-500 mb-2 uppercase tracking-tighter">Command_Input:</div>
                                        <MessageInput variant="bordered">
                                            <MessageInputTextarea
                                                className="bg-gray-900/50 border-gray-800 focus:border-cyan-500/50 rounded-none font-mono text-sm"
                                                placeholder="Enter command or natural language request..."
                                            />
                                            <MessageInputToolbar>
                                                <DictationButton />
                                                <MessageInputSubmitButton />
                                            </MessageInputToolbar>
                                        </MessageInput>
                                    </div>
                                </>
                            )}

                            {/* Console Toggle */}
                            <button
                                onClick={() => setIsChatOpen(!isChatOpen)}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full bg-black border border-cyan-500/20 border-r-0 rounded-l p-1 hover:bg-cyan-500/10 transition-colors"
                            >
                                {isChatOpen ? (
                                    <ChevronRight className="w-4 h-4 text-cyan-500" />
                                ) : (
                                    <ChevronLeft className="w-4 h-4 text-cyan-500" />
                                )}
                            </button>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </TamboProviderWithAuth>
    );
}
