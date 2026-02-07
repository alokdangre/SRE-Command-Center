"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Terminal, Mail, Lock, Github, AlertCircle, Loader2 } from "lucide-react";
import { login, signInWithGitHub, signInWithGoogle } from "@/app/auth/actions";

function LoginForm() {
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const searchParams = useSearchParams();
    const message = searchParams.get("message");
    const errorParam = searchParams.get("error");

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        setError(null);
        const result = await login(formData);
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    async function handleGitHubLogin() {
        setIsLoading(true);
        setError(null);
        const result = await signInWithGitHub();
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setIsLoading(true);
        setError(null);
        const result = await signInWithGoogle();
        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    return (
        <div className="w-full max-w-md relative">
            {/* Terminal Window */}
            <div className="border border-cyan-500/30 bg-black/80 backdrop-blur-sm">
                {/* Header */}
                <div className="bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-3 flex items-center gap-3">
                    <Terminal className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                        AUTHENTICATE_USER
                    </span>
                    <span className="ml-auto text-[10px] text-gray-500">v2.0.4</span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Status Messages */}
                    {message && (
                        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 text-xs flex items-center gap-2">
                            <span className="text-green-500">✓</span>
                            {message}
                        </div>
                    )}

                    {(error || errorParam) && (
                        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error || errorParam}
                        </div>
                    )}

                    {/* Login Form */}
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
                                className="w-full bg-black/60 border border-cyan-500/30 px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500 transition-colors"
                                placeholder="••••••••••••"
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
                                    AUTHENTICATING...
                                </>
                            ) : (
                                "INITIATE_SESSION"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-800" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-black px-4 text-gray-500 uppercase">OR_CONNECT_VIA</span>
                        </div>
                    </div>

                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleGitHubLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 border border-gray-700 py-3 text-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                            <Github className="w-4 h-4" />
                            GitHub
                        </button>
                        <button
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 border border-gray-700 py-3 text-sm hover:bg-gray-900 transition-colors disabled:opacity-50"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path
                                    fill="currentColor"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="currentColor"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Google
                        </button>
                    </div>

                    {/* Signup Link */}
                    <div className="text-center text-xs text-gray-500">
                        NO_ACCOUNT?{" "}
                        <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                            CREATE_OPERATOR_PROFILE
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-cyan-500/5 border-t border-cyan-500/10 px-4 py-2 flex items-center justify-between text-[10px] text-gray-600">
                    <span>SEC_PROTOCOL: TLS_1.3</span>
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
    );
}

function LoginFormFallback() {
    return (
        <div className="w-full max-w-md relative">
            <div className="border border-cyan-500/30 bg-black/80 backdrop-blur-sm p-6">
                <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                    <span className="text-cyan-500 text-xs uppercase tracking-widest">LOADING...</span>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen bg-black text-white font-mono flex items-center justify-center p-4">
            {/* Scanline Effect */}
            <div className="scanline" />

            {/* Background Grid */}
            <div className="fixed inset-0 opacity-5 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: "url('/grid.svg')", backgroundSize: "50px 50px" }} />
            </div>

            <Suspense fallback={<LoginFormFallback />}>
                <LoginForm />
            </Suspense>
        </div>
    );
}
