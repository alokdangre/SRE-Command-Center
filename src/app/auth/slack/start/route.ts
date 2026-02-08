import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "slack_oauth_state";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const origin = url.origin;

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

    if (!clientId || !clientSecret) {
        return NextResponse.redirect(
            `${siteUrl}/settings?error=${encodeURIComponent("Slack OAuth is not configured on the server.")}`
        );
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(`${siteUrl}/login?redirectTo=/settings`);
    }

    const state = crypto.randomUUID();
    const redirectUri = `${siteUrl}/auth/slack/callback`;
    const scope = [
        "channels:read",
        "channels:history",
        "groups:read",
        "groups:history",
        "users:read",
        "chat:write",
        "search:read",
    ].join(",");

    const params = new URLSearchParams({
        client_id: clientId,
        scope,
        redirect_uri: redirectUri,
        state,
    });

    const response = NextResponse.redirect(`https://slack.com/oauth/v2/authorize?${params.toString()}`);
    response.cookies.set({
        name: STATE_COOKIE,
        value: state,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/auth/slack",
        maxAge: 10 * 60,
    });

    return response;
}
