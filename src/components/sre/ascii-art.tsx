"use client";

import { motion } from "framer-motion";

const ASCII_LOGO = `
 ██████╗███╗   ███╗██████╗ 
██╔════╝████╗ ████║██╔══██╗
██║     ██╔████╔██║██║  ██║
██║     ██║╚██╔╝██║██║  ██║
╚██████╗██║ ╚═╝ ██║██████╔╝
 ╚═════╝╚═╝     ╚═╝╚═════╝ 
`;

export function AsciiLogo() {
    return (
        <div className="flex flex-col mb-4 pointer-events-none select-none overflow-hidden font-mono">
            <motion.pre
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] leading-[1] text-cyan-500"
            >
                {ASCII_LOGO}
            </motion.pre>
            <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 mt-1"
            >
                <div className="h-[1px] w-8 bg-cyan-500/30" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 font-bold">
                    Command_Center_v2.0 {"//"} Neural_Link
                </span>
                <div className="h-[1px] flex-1 bg-cyan-500/10" />
            </motion.div>
        </div>
    );
}

const SYSTEMS_READY = [
    { label: "SYSTEM_INIT", status: "OK", color: "text-green-500" },
    { label: "SECURITY_LEVEL", status: "CLEAR", color: "text-green-500" },
    { label: "NEURAL_LINK", status: "ACTIVE", color: "text-cyan-500" },
    { label: "KERNEL_SYNC", status: "STABLE", color: "text-green-500" },
];

export function AsciiStatus() {
    return (
        <div className="flex flex-col gap-1 mb-6 font-mono text-[10px]">
            {SYSTEMS_READY.map((sys, idx) => (
                <motion.div
                    key={sys.label}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.1 }}
                    className="flex items-center gap-4"
                >
                    <span className="text-gray-500 w-24">[{sys.label}]</span>
                    <span className="text-gray-700 flex-1">.........................</span>
                    <span className={`${sys.color} font-bold`}>{sys.status}</span>
                </motion.div>
            ))}
        </div>
    );
}
