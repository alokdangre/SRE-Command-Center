"use client";

import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/app/auth/actions";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";

export function UserNav() {
    const [user, setUser] = useState<User | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };

        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, [supabase.auth]);

    if (!user) return null;

    const userEmail = user.email || "Unknown";
    const userInitial = userEmail[0].toUpperCase();

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 border border-cyan-500/30 hover:bg-cyan-500/10 transition-colors"
            >
                <div className="w-6 h-6 bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xs text-cyan-400 font-bold">
                    {userInitial}
                </div>
                <span className="text-[10px] text-gray-400 uppercase tracking-wider hidden sm:block max-w-[150px] truncate">
                    {userEmail}
                </span>
                <ChevronDown className="w-3 h-3 text-gray-500" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute right-0 mt-1 w-56 bg-black border border-cyan-500/30 z-50 shadow-lg shadow-cyan-500/10">
                        <div className="px-4 py-3 border-b border-gray-800">
                            <div className="text-[10px] text-gray-500 uppercase mb-1">OPERATOR_ID</div>
                            <div className="text-xs text-white truncate">{userEmail}</div>
                        </div>

                        <div className="p-1">
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = "/settings";
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors"
                            >
                                <UserIcon className="w-3 h-3" />
                                PROFILE_SETTINGS
                            </button>

                            <form action={signOut}>
                                <button
                                    type="submit"
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                >
                                    <LogOut className="w-3 h-3" />
                                    TERMINATE_SESSION
                                </button>
                            </form>
                        </div>

                        <div className="px-4 py-2 border-t border-gray-800 text-[10px] text-gray-600">
                            SESSION_ACTIVE: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
