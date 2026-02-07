"use client";

import { useState } from "react";
import Link from "next/link";
import { Terminal, Mail, Lock, Shield, AlertCircle, Loader2 } from "lucide-react";
import { signup } from "@/app/auth/actions";

export default function SignupPage() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        const result = await signup(formData);
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
            {/* Scanline Effect */}
            <div className="scanline" />

            {/* Background Grid */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: "url('/grid.svg')", backgroundSize: "50px 50px" }} />
            </div>

            <div className="w-full max-w-md relative">
                {/* Terminal Window */}
                <div className="border border-cyan-500/30 bg-black/80 backdrop-blur-sm">
                    {/* Header */}
                    <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-3 flex items-center gap-3">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                            CREATE_OPERATOR_PROFILE
                        </span>
                        <span className="ml-auto text-[10px] text-gray-500">v2.0.4</span>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Security Notice */}
                        <div className="bg-cyan-500/5 border border-cyan-500/20 text-cyan-400/70 px-4 py-3 text-[10px] uppercase tracking-wide">
                            <div className="flex items-center gap-2 mb-1">
                                <Terminal className="w-3 h-3" />
                                SECURITY_PROTOCOL_NOTICE
                            </div>
                            <p className="text-gray-500 normal-case">
                                Your credentials are encrypted using AES-256. Email verification required.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-xs flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}

                        {/* Signup Form */}
                        <form action={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Mail className="w-3 h-3" />
                                    EMAIL_ADDRESS
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full bg-black/60 border border-cyan-500/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="operator@sre.dev"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="w-3 h-3" />
                                    ACCESS_KEY
                                </label>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    minLength={6}
                                    className="w-full bg-black/60 border border-cyan-500/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Min 6 characters"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <Lock className="w-3 h-3" />
                                    CONFIRM_ACCESS_KEY
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    required
                                    minLength={6}
                                    className="w-full bg-black/60 border border-cyan-500/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                    placeholder="Repeat access key"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-cyan-500 text-black font-bold py-3 uppercase tracking-widest hover:bg-cyan-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        CREATING_PROFILE...
                                    </>
                                ) : (
                                    "REGISTER_OPERATOR"
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <div className="text-center text-xs text-gray-500">
                            EXISTING_OPERATOR?{" "}
                            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                INITIATE_LOGIN
                            </Link>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-cyan-500/5 border-t border-cyan-500/10 px-4 py-2 flex items-center justify-between text-[10px] text-gray-600">
                        <span>ENC_LEVEL: AES-256</span>
                        <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            SECURE_CONN
                        </span>
                    </div>
                </div>

                {/* Back to Home */}
                <div className="mt-4 text-center">
                    <Link href="/" className="text-xs text-gray-500 hover:text-cyan-400 transition-colors">
                        ← RETURN_TO_MAIN_TERMINAL
                    </Link>
                </div>
            </div>
        </div>
    );
}
