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
    const [time, setTime] = useState("--:--:--");

    useEffect(() => {
        const updateTime = () => setTime(new Date().toLocaleTimeString());
        updateTime();
        const timer = setInterval(updateTime, 1000);
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
                        TELEMETRY: LIVE
                    </span>
                    <span className="flex items-center gap-1">
                        <Database className="w-3 h-3" />
                        SOURCE: INTEGRATIONS
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
                    {time}
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
            <TamboRuntimeContext incidentId="active-incident" isChatOpen={isChatOpen} />
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
                                    <div className="mt-4 p-4 border border-cyan-500/20 bg-cyan-500/5 terminal-flicker relative">
                                        <div className="absolute top-0 left-0 w-1 h-2 bg-cyan-500/40" />
                                        <div className="absolute top-0 right-0 w-1 h-2 bg-cyan-500/40" />
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                            <span className="text-amber-500 font-bold uppercase tracking-tighter text-xs">MODULE // LIVE_INCIDENT_WORKSPACE</span>
                                        </div>
                                        <p className="text-gray-300 leading-relaxed max-w-2xl">
                                            This dashboard shows live integration data only. Use the AI console to fetch
                                            current system overview, active alerts, incident timeline, and remediation options.
                                        </p>
                                        <div className="mt-4 flex gap-4 text-[10px] uppercase font-bold">
                                            <span className="text-cyan-400">STATUS: AWAITING_QUERY</span>
                                            <span className="text-gray-500">{"//"}</span>
                                            <span className="text-cyan-400">MODE: LIVE_DATA</span>
                                            <span className="text-gray-500">{"//"}</span>
                                            <span className="text-cyan-400">INTEGRATIONS: CONNECTED</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full md:w-auto">
                                    <AsciiStatus />
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="group relative p-4 border border-cyan-500/20 bg-black overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">DATA_STRM:</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                                                </div>
                                                <div className="text-xs font-bold text-gray-300">PROMETHEUS</div>
                                                <div className="flex items-end justify-between mt-2">
                                                    <div className="text-xl font-black text-cyan-500 tracking-tighter">LIVE</div>
                                                    <div className="text-[8px] text-cyan-500/40 font-mono mb-1">MS_LAT: 24ms</div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-12 h-12 bg-cyan-500/5 rotate-45 translate-x-6 translate-y-6" />
                                        </div>
                                        <div className="group relative p-4 border border-cyan-500/20 bg-black overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/40" />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">INC_VCTR:</span>
                                                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                                                </div>
                                                <div className="text-xs font-bold text-gray-300">PAGERDUTY</div>
                                                <div className="flex items-end justify-between mt-2">
                                                    <div className="text-xl font-black text-cyan-500 tracking-tighter">LIVE</div>
                                                    <div className="text-[8px] text-cyan-500/40 font-mono mb-1">ACK_RT: 98%</div>
                                                </div>
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-12 h-12 bg-cyan-500/5 rotate-45 translate-x-6 translate-y-6" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Remediation HUD */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-cyan-500 uppercase tracking-widest text-xs font-bold">
                                    <Zap className="w-4 h-4" />
                                    MODULE {"//"} REMEDIATION_ENG
                                </div>
                                <RemediationPanel
                                    incidentId="active-incident"
                                    initialSafeMode={false}
                                    initialTrafficShifting={false}
                                    initialTrafficPercentage={0}
                                />
                            </div>

                            {/* Live Command Guide */}
                            <div className="p-4 border border-gray-800 rounded bg-gray-900/20 font-mono text-xs text-gray-500 space-y-1">
                                <div>[LIVE] Try: Use tool getSystemOverview and show result.</div>
                                <div>[LIVE] Try: Use tool getActiveAlerts with severity critical.</div>
                                <div>[LIVE] Try: Use tool getCurrentIncident and getIncidentTimelineData.</div>
                                <div className="text-cyan-500/50">[READY] Waiting for live command_</div>
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
