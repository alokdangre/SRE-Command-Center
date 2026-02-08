import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/sre";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            // If this callback came from GitHub OAuth, persist integration metadata for the signed-in user.
            const {
                data: { session },
            } = await supabase.auth.getSession();
            const provider = session?.user?.app_metadata?.provider;
            const providerToken = (session as { provider_token?: string } | null)?.provider_token;
            const providerRefreshToken = (session as { provider_refresh_token?: string } | null)?.provider_refresh_token;

            if (provider === "github" && providerToken && session?.user?.id) {
                const userMeta = session.user.user_metadata as {
                    user_name?: string;
                    preferred_username?: string;
                    name?: string;
                } | undefined;

                const username =
                    userMeta?.user_name ||
                    userMeta?.preferred_username ||
                    userMeta?.name ||
                    session.user.email?.split("@")[0] ||
                    "";

                const { error: saveError } = await supabase
                    .from("user_integrations")
                    .upsert(
                        {
                            user_id: session.user.id,
                            integration_type: "github",
                            config: {
                                type: "oauth",
                                access_token: providerToken,
                                refresh_token: providerRefreshToken || undefined,
                                username,
                                repos: [],
                                default_repo: undefined,
                            },
                            is_enabled: true,
                            last_verified_at: new Date().toISOString(),
                            last_error: null,
                        },
                        { onConflict: "user_id,integration_type" }
                    );

                if (saveError) {
                    const url = new URL(`${origin}/settings`);
                    url.searchParams.set("error", `GitHub connected, but integration save failed: ${saveError.message}`);
                    return NextResponse.redirect(url.toString());
                }
            }

            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`);
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`);
            } else {
                return NextResponse.redirect(`${origin}${next}`);
            }
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=Could not authenticate user`);
}
