import Link from "next/link";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import { Terminal, Shield, Zap, Activity, Cpu, Database, Command } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-cyan-500/30 overflow-hidden">
      {/* Scanline Effect */}
      <div className="scanline" />

      {/* Hero Section */}
      <div className="relative border-b border-cyan-500/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(0,240,255,0.05)_0%,_transparent_100%)] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-24">
          <div className="flex flex-col items-center text-center space-y-8 animate-fade-in">
            {/* System Status HUD */}
            <div className="flex gap-4 text-[10px] text-cyan-500/50 uppercase tracking-[0.2em] mb-4">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> CPU_INIT: OK</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3" /> MEM_ADDR: 0x7FF</span>
              <span className="flex items-center gap-1 text-green-500"><Shield className="w-3 h-3" /> SEC_LEVEL: MAX</span>
            </div>

            {/* Main Title */}
            <div className="space-y-4">
              <div className="inline-block p-1 border border-cyan-500/30 bg-cyan-500/5 rounded animate-pulse">
                <Terminal className="w-8 h-8 text-cyan-500" />
              </div>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tighter">
                <span className="glow-text-cyan">SRE_COMMAND_CTR</span>
                <span className="text-cyan-500 animate-pulse">_</span>
              </h1>
              <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base leading-relaxed uppercase tracking-wide">
                Autonomous incident response system // Neural-link enabled // Multi-tool orchestration
              </p>
            </div>

            {/* Launch CTA */}
            <ApiKeyCheck>
              <div className="flex flex-col sm:flex-row gap-6 pt-8">
                <Link
                  href="/sre"
                  className="px-10 py-4 bg-cyan-500 text-black font-bold uppercase tracking-widest hover:bg-cyan-400 transition-all border-b-4 border-cyan-700 active:translate-y-1 active:border-b-0"
                >
                  INITIALIZE_COMMAND_CTR
                </Link>
                <Link
                  href="/chat"
                  className="px-10 py-4 border border-cyan-500/50 text-cyan-500 font-bold uppercase tracking-widest hover:bg-cyan-500/10 transition-all"
                >
                  DELEGATED_CHAT_MODE
                </Link>
              </div>
            </ApiKeyCheck>

            {/* ASCII Visual Separator */}
            <pre className="text-[8px] text-gray-700 leading-none select-none py-12 hidden md:block">
              {`+------------------------------------------------------------------------------------------------------------------------------------------+
| [SYSTEM_LOGS]                                                                                                                  [v2.0.4] |
| > Authenticating neural link... [OK]                                                                                           [WAR_ROOM] |
| > Loading generative_ui_manifest... [DONE]                                                                                     [SECURED]  |
+------------------------------------------------------------------------------------------------------------------------------------------+`}
            </pre>
          </div>
        </div>
      </div>

      {/* Grid Showcase */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {[
            {
              icon: <Command className="w-5 h-5" />,
              title: "GENERATIVE_HUD",
              description: "Dynamic UI injection for real-time telemetry and incident visualization."
            },
            {
              icon: <Activity className="w-5 h-5" />,
              title: "NEURAL_ANALYTICS",
              description: "AI-driven root cause analysis through commit logs and team discussion."
            },
            {
              icon: <Zap className="w-5 h-5" />,
              title: "REMEDIATION_ENG",
              description: "Interactable controls for traffic shifting, rollbacks, and safe-mode."
            }
          ].map((feature, i) => (
            <div key={i} className="group p-8 border border-white/5 hover:border-cyan-500/30 bg-white/[0.02] transition-colors relative">
              <div className="text-cyan-500 mb-6 opacity-50 group-hover:opacity-100 transition-opacity">
                {feature.icon}
              </div>
              <h3 className="text-sm font-bold mb-4 tracking-[0.2em]">{feature.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed uppercase">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Footer */}
      <footer className="border-t border-white/5 py-12 opacity-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-[10px] uppercase tracking-widest gap-8">
          <div className="flex gap-8">
            <span>(C) 2026 TAMBO_AI</span>
            <span className="text-gray-700">//</span>
            <span>ENC_DEPT_BETA</span>
          </div>
          <div className="flex gap-8">
            <a href="https://docs.tambo.co" className="hover:text-cyan-400 transition-colors">Documentation</a>
            <a href="https://github.com/tambo-ai/tambo" className="hover:text-cyan-400 transition-colors">Source_Repo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
