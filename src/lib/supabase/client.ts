import { createBrowserClient } from "@supabase/ssr";

const MISSING_KEY_PLACEHOLDER = "placeholder-key-for-build";

export function createClient() {
    // During static page generation, environment variables may not be available
    // Use placeholders to prevent build failures - the actual values are required at runtime
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || `https://${MISSING_KEY_PLACEHOLDER}.supabase.co`;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || MISSING_KEY_PLACEHOLDER;

    return createBrowserClient(url, key);
}

