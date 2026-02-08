"use client";

import { MessageThreadFull } from "@/components/tambo/message-thread-full";
import { useMcpServers } from "@/components/tambo/mcp-config-modal";
import { TamboRuntimeContext } from "@/components/tambo/tambo-runtime-context";
import { ThreadPersistence } from "@/components/tambo/thread-persistence";
import { components, tools } from "@/lib/tambo";
import { TamboProvider } from "@tambo-ai/react";
import { Terminal, Shield, Cpu, Activity, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useId, useMemo } from "react";

export default function ChatPage() {
  const mcpServers = useMcpServers();
  const id = useId();
  const sessionId = useMemo(() => id.replace(/:/g, "").substring(0, 6).toUpperCase(), [id]);

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
      components={components}
      tools={tools}
      tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
      mcpServers={mcpServers}
    >
      <div className="h-screen bg-[#05070a] text-white font-mono selection:bg-cyan-500/30 overflow-hidden relative flex flex-col">
        {/* Dynamic Background */}
        <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20" />
        <div className="fixed inset-0 noise-bg pointer-events-none" />
        <div className="scanline" />

        {/* Terminal Header */}
        <header className="relative z-50 border-b border-cyan-500/10 bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="p-1.5 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors">
                <ChevronLeft className="w-4 h-4 text-cyan-500" />
              </Link>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-black tracking-tighter glow-text-cyan flex items-center gap-2">
                  NEURAL_LINK_CONSOLE
                  <span className="px-1.5 py-0.5 border border-cyan-500/30 text-[8px] bg-cyan-500/5">STREAM_ACTIVE</span>
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> PROC: OPTIMAL</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-cyan-500 animate-pulse" /> SYNC: 100%</span>
              <span className="flex items-center gap-1 text-green-500"><Shield className="w-3 h-3" /> SEC: MAX</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 relative z-20 overflow-hidden flex flex-col w-full bg-black/40">
          <ThreadPersistence />
          <TamboRuntimeContext incidentId="general-chat" isChatOpen />

          <div className="flex-1 overflow-hidden relative max-w-4xl mx-auto w-full border-x border-cyan-500/10">
            <MessageThreadFull className="h-full" />
          </div>
        </main>

        {/* Console Status Bar */}
        <footer className="relative z-50 border-t border-cyan-500/10 bg-black/60 px-6 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-[9px] text-gray-600 uppercase font-bold tracking-widest">
            <div className="flex gap-4">
              <span>LOC: 0x82_NODE_A</span>
              <span className="text-cyan-500/30">{"//"}</span>
              <span>SESSION_ID: {sessionId}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              SYSTEMS_NOMINAL
            </div>
          </div>
        </footer>
      </div>
    </TamboProvider>
  );
}
