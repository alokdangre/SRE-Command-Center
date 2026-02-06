"use client";

import { motion } from "framer-motion";

const ASCII_LOGO = `
 ██████╗███╗   ███╗██████╗ 
██╔════╝████╗ ████║██╔══██╗
██║     ██╔████╔██║██║  ██║
██║     ██║╚██╔╝██║██║  ██║
╚██████╗██║ ╚═╝ ██║██████╔╝
 ╚═════╝╚═╝     ╚═╝╚═════╝ 
   COMMAND CENTER v2.0
`;

export function AsciiLogo() {
    return (
        <motion.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] leading-[1] text-cyan-500 font-mono mb-4 pointer-events-none select-none overflow-hidden"
        >
            {ASCII_LOGO}
        </motion.pre>
    );
}

const SYSTEMS_READY = `
[SYSTEM_INIT] ................. OK
[SECURITY_LEVEL] ............ CLEAR
[NEURAL_LINK] ............... ACTIVE
`;

export function AsciiStatus() {
    return (
        <motion.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] leading-[1] text-green-500 font-mono opacity-50 mb-4"
        >
            {SYSTEMS_READY}
        </motion.pre>
    );
}
