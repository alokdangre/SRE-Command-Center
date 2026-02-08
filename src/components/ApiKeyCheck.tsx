"use client";

import { useState } from "react";
import { ShieldAlert, Cpu, Copy, Check, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface ApiKeyCheckProps {
  children: React.ReactNode;
}

const ApiKeyMissingAlert = () => (
  <div className="mt-6 p-6 border border-amber-500/30 bg-amber-500/5 relative overflow-hidden font-mono">
    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/40" />
    <div className="flex items-center gap-3 text-amber-500 mb-4 font-black italic tracking-tighter">
      <ShieldAlert className="w-5 h-5 animate-pulse" />
      <span>MISSION_CRITICAL // INITIALIZATION_ERROR</span>
    </div>

    <p className="text-gray-300 text-sm mb-6 uppercase tracking-wider leading-relaxed">
      Neural link requires an active Tambo handshake. No API key detected in your local environment.
    </p>

    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-[10px] text-amber-500/50 uppercase font-bold tracking-widest">Execute_Command:</div>
        <div className="flex items-center gap-2 bg-black/40 border border-gray-800 p-3 relative group">
          <code className="text-cyan-500 text-xs flex-grow">npx tambo init</code>
          <CopyButton text="npx tambo init" />
        </div>
      </div>

      <div className="pt-4 border-t border-amber-500/10">
        <a
          href="https://tambo.co/cli-auth"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-cyan-400 transition-colors uppercase font-black"
        >
          Request_Neural_Credentials <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [showCopied, setShowCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="p-1.5 text-gray-500 hover:text-white transition-colors"
    >
      {showCopied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
};

export function ApiKeyCheck({ children }: ApiKeyCheckProps) {
  const isApiKeyMissing = !process.env.NEXT_PUBLIC_TAMBO_API_KEY;

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        {/* Connection Status Label - Subtle and Cyberpunk */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-1 border border-cyan-500/20 bg-cyan-500/5">
            <div className={`w-1.5 h-1.5 rounded-full ${isApiKeyMissing ? "bg-amber-500 animate-pulse" : "bg-green-500"} shadow-[0_0_8px_rgba(34,197,94,0.3)]`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/70">
              {isApiKeyMissing ? "SRE_OS: STANDBY" : "KERNEL_LINK: STABLE"}
            </span>
          </div>
          <div className="h-px w-8 bg-cyan-500/10" />
          <div className="flex items-center gap-2 px-3 py-1 border border-cyan-500/20 bg-cyan-500/5">
            <Cpu className="w-3 h-3 text-cyan-500/50" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500/70">
              {isApiKeyMissing ? "AUTH: PENDING" : "AUTH: VERIFIED"}
            </span>
          </div>
        </div>

        {isApiKeyMissing ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full"
          >
            <ApiKeyMissingAlert />
          </motion.div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
