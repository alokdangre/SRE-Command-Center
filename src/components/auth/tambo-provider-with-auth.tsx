"use client";

/**
 * TamboProviderWithAuth
 * Wraps TamboProvider with Supabase authentication, passing the user's access token
 * to enable per-user auth in Tambo.
 */

import { useEffect, useState, ReactNode } from "react";
import { TamboProvider, TamboComponent, TamboTool, type McpServerInfo } from "@tambo-ai/react";
import { createClient } from "@/lib/supabase/client";

interface TamboProviderWithAuthProps {
    children: ReactNode;
    components: TamboComponent[];
    tools: TamboTool[];
    mcpServers?: (McpServerInfo | string)[];
}

export function TamboProviderWithAuth({
    children,
    components,
    tools,
    mcpServers = [],
}: TamboProviderWithAuthProps) {
    const [accessToken, setAccessToken] = useState<string | undefined>();
    const [isInitialized, setIsInitialized] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            try {
                const {
                    data: { session },
                } = await supabase.auth.getSession();
                setAccessToken(session?.access_token);
            } catch (error) {
                console.error("Error getting session:", error);
            } finally {
                setIsInitialized(true);
            }
        };

        getInitialSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setAccessToken(session?.access_token);
        });

        return () => subscription.unsubscribe();
    }, [supabase]);

    // Wait for initial session check
    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-cyan-500 text-xs font-mono uppercase tracking-widest">
                        INITIALIZING_SESSION...
                    </span>
                </div>
            </div>
        );
    }

    return (
        <TamboProvider
            apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY!}
            components={components}
            tools={tools}
            tamboUrl={process.env.NEXT_PUBLIC_TAMBO_URL}
            mcpServers={mcpServers}
            userToken={accessToken}
        >
            {children}
        </TamboProvider>
    );
}
