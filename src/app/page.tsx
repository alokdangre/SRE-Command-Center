"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiKeyCheck } from "@/components/ApiKeyCheck";
import {
  Terminal, Shield, Zap, Activity, Cpu,
  Github, ExternalLink, Globe, Lock, ChevronRight,
  BarChart3, Brain, Network
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [isBooted, setIsBooted] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    const logs = [
      "INITIALIZING NEURAL_LINK...",
      "AUTHENTICATING OPERATOR...",
      "LOADING GENERATIVE_UI_MANIFEST...",
      "STABILIZING KERNEL_SYNC...",
      "SYSTEM_READY: 100%"
    ];

    let currentLog = 0;
    const interval = setInterval(() => {
      if (currentLog < logs.length) {
        setBootLogs(prev => [...prev, logs[currentLog]]);
        currentLog++;
      } else {
        clearInterval(interval);
        setTimeout(() => setIsBooted(true), 500);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070a] text-white font-mono selection:bg-cyan-500/30 overflow-x-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 cyber-grid pointer-events-none opacity-20" />
      <div className="fixed inset-0 noise-bg pointer-events-none" />
      <div className="scanline" />

      <AnimatePresence>
        {!isBooted && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-md w-full space-y-4">
              <div className="flex items-center gap-3 text-cyan-500 mb-8 border-b border-cyan-500/20 pb-4">
                <Terminal className="w-6 h-6 animate-pulse" />
                <span className="text-sm font-bold tracking-[0.3em]">SRE_OS_BOOT_SEQUENCE</span>
              </div>
              <div className="space-y-2">
                {bootLogs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[10px] text-cyan-500/70"
                  >
                    <span className="text-cyan-500/30 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </motion.div>
                ))}
              </div>
              <motion.div
                className="h-1 bg-cyan-500/10 mt-8 relative overflow-hidden"
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2.5 }}
                  className="absolute inset-0 bg-cyan-500"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Header */}
      <header className="relative z-50 border-b border-cyan-500/10 bg-black/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-1.5 border border-cyan-500/20 bg-cyan-500/5">
              <Terminal className="w-5 h-5 text-cyan-500" />
            </div>
            <span className="text-sm font-black tracking-tighter glow-text-cyan hidden md:block">
              SRE_COMMAND_CTR <span className="text-cyan-500/50">v2.0.4</span>
            </span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-[10px] uppercase font-bold text-gray-400">
              <a href="#features" className="hover:text-cyan-400 transition-colors">Tactical_Features</a>
              <a href="#tech" className="hover:text-cyan-400 transition-colors">Neural_Arch</a>
              <Link href="/settings" className="hover:text-cyan-400 transition-colors">Global_Config</Link>
            </nav>
            <div className="h-4 w-px bg-gray-800 hidden md:block" />
            <a
              href="https://github.com/alokdangre/SRE-Command-Center"
              target="_blank"
              className="p-2 text-gray-500 hover:text-white transition-colors"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        {/* Glow Spheres */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 text-[10px] text-cyan-500/40 uppercase tracking-[0.4em] mb-12"
            >
              <span className="flex items-center gap-2"><Cpu className="w-3 h-3" /> CORE: ACTIVE</span>
              <span className="flex items-center gap-2"><Lock className="w-3 h-3 text-green-500/50" /> SEC: MAX</span>
              <span className="flex items-center gap-2 animate-pulse"><Globe className="w-3 h-3 text-cyan-400" /> LAT: 12ms</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none italic">
                <span className="glow-text-cyan bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">
                  AUTONOMOUS
                </span><br />
                <span className="text-cyan-500">INCIDENT_OPS</span>
              </h1>

              <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-lg uppercase tracking-wider leading-relaxed">
                Next-gen SRE platform for <span className="text-white">neural-link</span> orchestration.
                Full-stack telemetry and AI-driven remediation at the edge.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-12"
            >
              <ApiKeyCheck>
                <div className="flex flex-col sm:flex-row gap-6 relative group">
                  <Link
                    href="/sre"
                    className="relative px-12 py-5 bg-cyan-500 text-black font-black uppercase tracking-[0.2em] transition-all hover:bg-cyan-400 hover:scale-105 active:scale-95 group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform skew-x-12" />
                    <span className="relative flex items-center gap-3">
                      Initialize_Command_Ctr <ChevronRight className="w-5 h-5" />
                    </span>
                  </Link>
                  <Link
                    href="/chat"
                    className="px-12 py-5 border border-cyan-500/30 text-cyan-500 font-black uppercase tracking-[0.2em] transition-all hover:bg-cyan-500/10 glitch-hover"
                  >
                    Enter_Chat_Mode
                  </Link>
                </div>
              </ApiKeyCheck>
            </motion.div>

            {/* Visual HUD Decoration */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              transition={{ delay: 1 }}
              className="mt-24 w-full h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent relative"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#05070a] px-4 text-[8px] text-gray-600 tracking-[1em] uppercase">
                Tactical_Telemetry_Lock_V2.0
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-cyan-500/10 border border-cyan-500/10">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "NEURAL_ANALYTICS",
                desc: "AI-driven root cause analysis cross-referencing commit logs, telemetry, and team discussions.",
                tag: "ML_ENABLED"
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: "AUTO_REMEDIATION",
                desc: "One-click deployment rollbacks, traffic shifting, and safe-mode instantiation.",
                tag: "LIVE_ACTION"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "REALTIME_HUD",
                desc: "Dynamic UI injection for live telemetry visualization and high-density operational data.",
                tag: "HUD_SYNC"
              },
              {
                icon: <Network className="w-6 h-6" />,
                title: "MULTI_CLUSTER",
                desc: "Orchestrate across multiple Kubernetes environments and cloud providers via unified control plane.",
                tag: "K8S_NATIVE"
              },
              {
                icon: <Activity className="w-6 h-6" />,
                title: "INCIDENT_TIMELINE",
                desc: "Automated event correlation and documentation for post-mortem analysis.",
                tag: "DATA_OPS"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "SECURITY_PROTOCOL",
                desc: "Encrypted credential management and scoped access controls for all infrastructure actions.",
                tag: "ENC_LEVEL_3"
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-10 bg-[#05070a] hover:bg-cyan-500/[0.03] transition-colors relative overflow-hidden"
              >
                <div className="text-cyan-500 mb-8 opacity-40 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 duration-500">
                  {f.icon}
                </div>
                <div className="text-[8px] text-cyan-500/40 mb-2 font-bold tracking-widest uppercase">{f.tag}</div>
                <h3 className="text-sm font-black mb-4 tracking-widest text-gray-200 group-hover:text-cyan-400 transition-colors italic">
                  {f.title}
                </h3>
                <p className="text-[11px] text-gray-500 leading-relaxed uppercase tracking-wide">
                  {f.desc}
                </p>
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-20 flex gap-1">
                  <div className="w-1 h-3 bg-cyan-500" />
                  <div className="w-1 h-2 bg-cyan-500" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack / Neural Arch Section */}
      <section id="tech" className="py-24 border-y border-cyan-500/10 bg-black/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-3 text-cyan-500/50">
                <Network className="w-5 h-5" />
                <span className="text-[10px] uppercase tracking-[0.5em] font-bold">Infrastructural_Layer</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter uppercase">
                Forged for <span className="text-cyan-500 glow-text-cyan">High_Stake</span> Resilience
              </h2>
              <p className="text-gray-500 text-sm md:text-base leading-relaxed uppercase tracking-wider">
                We&apos;ve built SRE Command Center on top of the most resilient modern primitives.
                Fully integrated with Prometheus for metrics, PagerDuty for orchestration,
                and Kubernetes for execution.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {['PROMETHEUS', 'PAGERDUTY', 'KUBERNETES', 'GRAFANA', 'GITHUB', 'SLACK'].map(t => (
                  <div key={t} className="flex items-center gap-3 text-[10px] font-bold text-gray-400 group">
                    <div className="w-1 h-1 bg-cyan-500 group-hover:scale-150 transition-transform" />
                    {t}_SUPPORTED
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg p-8 border border-cyan-500/20 bg-cyan-500/5 relative">
              <div className="absolute -top-3 -left-3 p-2 bg-[#05070a] border border-cyan-500/20 text-cyan-500">
                <Brain className="w-4 h-4" />
              </div>
              <div className="space-y-4 font-mono text-[10px]">
                <div className="flex justify-between border-b border-cyan-500/10 pb-2">
                  <span className="text-gray-500">NEURAL_SYNC_RATE</span>
                  <span className="text-cyan-500">0.9998_SF</span>
                </div>
                <div className="flex justify-between border-b border-cyan-500/10 pb-2">
                  <span className="text-gray-500">THROUGHPUT</span>
                  <span className="text-cyan-500">42GB/SEC_AGGR</span>
                </div>
                <div className="flex justify-between border-b border-cyan-500/10 pb-2">
                  <span className="text-gray-500">ANOMALY_DETECTION</span>
                  <span className="text-green-500">OPTIMAL</span>
                </div>
                <pre className="text-[8px] text-cyan-500/40 pt-4 leading-none">
                  {`>> STABILIZING_MATRIX...
>> RECALIBRATING_SENSORS...
>> [####################] 100%
>> ARCH_STABLE_VERIFIED`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className="relative pt-24 pb-12 overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-t from-cyan-900/10 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-gray-800">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-cyan-500 text-black">
                  <Terminal className="w-6 h-6" />
                </div>
                <span className="text-xl font-black italic tracking-tighter">SRE_COMMAND_CTR</span>
              </div>
              <p className="text-gray-500 text-xs uppercase tracking-widest max-w-sm leading-relaxed">
                Autonomous system management for the brave. Built by the SRE_CMD_OPS engineering collective.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer">
                    <Github className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-all cursor-pointer">
                    <Globe className="w-4 h-4" />
                  </div>
                </div>
                <div className="h-8 w-px bg-gray-800" />
                <a href="https://tambo.co" target="_blank" className="group flex items-center gap-2">
                  <div className="text-[10px] text-gray-600 group-hover:text-gray-400 transition-colors uppercase font-bold tracking-tighter">Powered_By</div>
                  <div className="px-2 py-0.5 border border-cyan-500/20 bg-cyan-500/5 text-cyan-500 text-[10px] font-black tracking-widest group-hover:border-cyan-500/50 transition-all">TAMBO</div>
                </a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Operation_Logs</h4>
              <ul className="space-y-2 text-[10px] uppercase font-bold text-gray-500">
                <li><Link href="/sre" className="hover:text-white transition-colors flex items-center gap-2 underline underline-offset-4 decoration-cyan-500/30">Initialize_Dash</Link></li>
                <li><Link href="/settings" className="hover:text-white transition-colors flex items-center gap-2 underline underline-offset-4 decoration-cyan-500/30">Global_Settings</Link></li>
                <li><Link href="/chat" className="hover:text-white transition-colors flex items-center gap-2 underline underline-offset-4 decoration-cyan-500/30">AI_Console</Link></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Terminal_Links</h4>
              <ul className="space-y-2 text-[10px] uppercase font-bold text-gray-500">
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2">Protocol_Docs <ExternalLink className="w-3 h-3 opacity-30" /></a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2">Source_Code <ExternalLink className="w-3 h-3 opacity-30" /></a></li>
                <li><a href="#" className="hover:text-white transition-colors flex items-center gap-2 italic">Neural_Cloud <Lock className="w-3 h-3 opacity-30" /></a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] uppercase font-bold text-gray-600 tracking-widest">
            <div className="flex items-center gap-4">
              <span>&copy;2026 SRE_COMMAND_CTR_SYSTEMS</span>
              <span className="hidden md:block">{"//"}</span>
              <span>ENC_DEPT_BETA_V2</span>
            </div>
            <div className="flex items-center gap-8">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                SERVICES_NOMINAL
              </span>
              <span className="text-cyan-500/40">LOC: 0x82_NODE_A</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
