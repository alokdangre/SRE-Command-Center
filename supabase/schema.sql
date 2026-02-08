-- =========================================================================
-- SRE Command Center - Supabase Database Schema
-- =========================================================================
-- Run this in your Supabase SQL Editor to set up the required tables
-- =========================================================================

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =========================================================================
-- User Integrations Table
-- =========================================================================
-- Stores integration configurations per user (GitHub, Prometheus, Slack, etc.)

CREATE TABLE IF NOT EXISTS user_integrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL CHECK (integration_type IN ('github', 'prometheus', 'slack', 'kubernetes', 'pagerduty')),
    
    -- Integration-specific configuration (encrypted at rest by Supabase)
    config JSONB NOT NULL DEFAULT '{}',
    
    -- Status tracking
    is_enabled BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMPTZ,
    last_error TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Each user can only have one config per integration type
    UNIQUE(user_id, integration_type)
);

-- Enable RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own integrations
CREATE POLICY "Users can view their own integrations"
    ON user_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own integrations"
    ON user_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own integrations"
    ON user_integrations FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own integrations"
    ON user_integrations FOR DELETE
    USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX idx_user_integrations_user_id ON user_integrations(user_id);
CREATE INDEX idx_user_integrations_type ON user_integrations(integration_type);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_integrations_updated_at
    BEFORE UPDATE ON user_integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- User Preferences Table
-- =========================================================================
-- Stores user preferences (theme, notifications, etc.)

CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    
    -- Preferences
    theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'system')),
    notifications_enabled BOOLEAN DEFAULT true,
    sound_enabled BOOLEAN DEFAULT true,
    default_dashboard TEXT DEFAULT 'overview',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only access their own preferences
CREATE POLICY "Users can view their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Incident History Table (Optional - for persistence)
-- =========================================================================
-- Stores incident data for historical analysis

CREATE TABLE IF NOT EXISTS incidents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Incident data
    title TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'mitigating', 'resolved')),
    description TEXT,
    
    -- AI analysis
    root_cause TEXT,
    resolution TEXT,
    
    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incidents"
    ON incidents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incidents"
    ON incidents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incidents"
    ON incidents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================================================
-- Thread History Table (Conversation Persistence)
-- =========================================================================
-- Stores thread snapshots for historical review and audit.

CREATE TABLE IF NOT EXISTS thread_history (
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

-- Enable RLS
ALTER TABLE thread_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own thread history
CREATE POLICY "Users can view their own thread history"
    ON thread_history FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thread history"
    ON thread_history FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thread history"
    ON thread_history FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thread history"
    ON thread_history FOR DELETE
    USING (auth.uid() = user_id);

CREATE INDEX idx_thread_history_user_id ON thread_history(user_id);
CREATE INDEX idx_thread_history_thread_id ON thread_history(thread_id);
CREATE INDEX idx_thread_history_last_message_at ON thread_history(last_message_at DESC);

CREATE TRIGGER update_thread_history_updated_at
    BEFORE UPDATE ON thread_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
