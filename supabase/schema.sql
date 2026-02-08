-- =========================================================================
-- SRE Command Center - Supabase Database Schema
-- =========================================================================
-- Run this entire file in Supabase SQL Editor.
-- It is idempotent and safe to re-run.
-- =========================================================================

BEGIN;

-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Shared trigger function for updated_at maintenance.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =========================================================================
-- User Integrations Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('github', 'prometheus', 'slack', 'kubernetes', 'pagerduty')),
    config JSONB NOT NULL DEFAULT '{}',
    is_enabled BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, integration_type)
);

ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own integrations" ON public.user_integrations;
CREATE POLICY "Users can view their own integrations"
    ON public.user_integrations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own integrations" ON public.user_integrations;
CREATE POLICY "Users can insert their own integrations"
    ON public.user_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own integrations" ON public.user_integrations;
CREATE POLICY "Users can update their own integrations"
    ON public.user_integrations FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own integrations" ON public.user_integrations;
CREATE POLICY "Users can delete their own integrations"
    ON public.user_integrations FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user_id ON public.user_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_integrations_type ON public.user_integrations(integration_type);

DROP TRIGGER IF EXISTS update_user_integrations_updated_at ON public.user_integrations;
CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON public.user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- User Preferences Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    default_dashboard TEXT DEFAULT 'overview',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- Incident History Table
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'mitigating', 'resolved')),
    description TEXT,
    root_cause TEXT,
    resolution TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own incidents" ON public.incidents;
CREATE POLICY "Users can view their own incidents"
    ON public.incidents FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own incidents" ON public.incidents;
CREATE POLICY "Users can insert their own incidents"
    ON public.incidents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own incidents" ON public.incidents;
CREATE POLICY "Users can update their own incidents"
    ON public.incidents FOR UPDATE
    USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_incidents_updated_at ON public.incidents;
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- Thread History Table (Conversation Persistence)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.thread_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    thread_id TEXT NOT NULL,
    title TEXT,
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    thread_payload JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, thread_id)
);

ALTER TABLE public.thread_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own thread history" ON public.thread_history;
CREATE POLICY "Users can view their own thread history"
    ON public.thread_history FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own thread history" ON public.thread_history;
CREATE POLICY "Users can insert their own thread history"
    ON public.thread_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own thread history" ON public.thread_history;
CREATE POLICY "Users can update their own thread history"
    ON public.thread_history FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own thread history" ON public.thread_history;
CREATE POLICY "Users can delete their own thread history"
    ON public.thread_history FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_thread_history_user_id ON public.thread_history(user_id);
CREATE INDEX IF NOT EXISTS idx_thread_history_thread_id ON public.thread_history(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_history_last_message_at ON public.thread_history(last_message_at DESC);

DROP TRIGGER IF EXISTS update_thread_history_updated_at ON public.thread_history;
CREATE TRIGGER update_thread_history_updated_at
    BEFORE UPDATE ON public.thread_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMIT;
