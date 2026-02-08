import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "slack_oauth_state";

interface SlackOAuthResponse {
    ok: boolean;
    error?: string;
    access_token?: string;
    team?: {
        id: string;
        name: string;
    };
}

function redirectWithMessage(baseUrl: string, params: Record<string, string>) {
    const url = new URL("/settings", baseUrl);
    Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });
    return NextResponse.redirect(url.toString());
}

export async function GET(request: Request) {
    const url = new URL(request.url);
    const origin = url.origin;
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

    if (error) {
        return redirectWithMessage(siteUrl, { error: `Slack OAuth cancelled: ${error}` });
    }

    const cookieState = request.headers
        .get("cookie")
        ?.split(";")
        .map(part => part.trim())
        .find(part => part.startsWith(`${STATE_COOKIE}=`))
        ?.split("=")[1];

    if (!code || !state || !cookieState || state !== cookieState) {
        return redirectWithMessage(siteUrl, { error: "Invalid Slack OAuth state. Please try again." });
    }

    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        return redirectWithMessage(siteUrl, { error: "Slack OAuth is not configured on the server." });
    }

    const redirectUri = `${siteUrl}/auth/slack/callback`;

    try {
        const tokenResponse = await fetch("https://slack.com/api/oauth.v2.access", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectUri,
            }).toString(),
        });

        const oauthData = (await tokenResponse.json()) as SlackOAuthResponse;

        if (!tokenResponse.ok || !oauthData.ok || !oauthData.access_token || !oauthData.team?.id) {
            const oauthError = oauthData.error || `Slack token exchange failed (${tokenResponse.status})`;
            return redirectWithMessage(siteUrl, { error: oauthError });
        }

        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.redirect(`${siteUrl}/login?redirectTo=/settings`);
        }

        const { error: saveError } = await supabase
            .from("user_integrations")
            .upsert(
                {
                    user_id: user.id,
                    integration_type: "slack",
                    config: {
                        type: "oauth",
                        access_token: oauthData.access_token,
                        team_id: oauthData.team.id,
                        team_name: oauthData.team.name,
                        default_channel: "#incidents",
                    },
                    is_enabled: true,
                    last_verified_at: new Date().toISOString(),
                    last_error: null,
                },
                { onConflict: "user_id,integration_type" }
            );

        if (saveError) {
            return redirectWithMessage(siteUrl, { error: `Failed to save Slack integration: ${saveError.message}` });
        }

        const response = redirectWithMessage(siteUrl, {
            message: "Slack integration connected successfully.",
            integration: "slack",
        });
        response.cookies.set({
            name: STATE_COOKIE,
            value: "",
            maxAge: 0,
            path: "/auth/slack",
        });
        return response;
    } catch (exchangeError) {
        return redirectWithMessage(siteUrl, {
            error:
                exchangeError instanceof Error
                    ? exchangeError.message
                    : "Failed to complete Slack OAuth flow.",
        });
    }
}
