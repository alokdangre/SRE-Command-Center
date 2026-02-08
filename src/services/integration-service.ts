/**
 * Integration Service
 * Handles CRUD operations for user integrations in Supabase
 */

import { createClient } from '@/lib/supabase/client';
import { validateAndNormalizeKubernetesConfig } from '@/lib/integrations/kubernetes-security';
import type {
    IntegrationType,
    UserIntegration,
    GitHubConfig,
    PrometheusConfig,
    KubernetesConfig,
} from '@/types/integrations';

/**
 * Get all integrations for the current user
 */
export async function getUserIntegrations(): Promise<UserIntegration[]> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error fetching integrations:', error);
        throw error;
    }

    return data as UserIntegration[];
}

/**
 * Get a specific integration by type
 */
export async function getIntegration(type: IntegrationType): Promise<UserIntegration | null> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('user_integrations')
        .select('*')
        .eq('user_id', user.id)
        .eq('integration_type', type)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No rows found
            return null;
        }
        console.error('Error fetching integration:', error);
        throw error;
    }

    return data as UserIntegration;
}

/**
 * Save or update an integration
 */
export async function saveIntegration(
    type: IntegrationType,
    config: Record<string, unknown>,
    enabled: boolean = true
): Promise<UserIntegration> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('user_integrations')
        .upsert({
            user_id: user.id,
            integration_type: type,
            config,
            is_enabled: enabled,
            last_verified_at: new Date().toISOString(),
            last_error: null,
        }, {
            onConflict: 'user_id,integration_type',
        })
        .select()
        .single();

    if (error) {
        console.error('Error saving integration:', error);
        throw error;
    }

    return data as UserIntegration;
}

/**
 * Delete an integration
 */
export async function deleteIntegration(type: IntegrationType): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', user.id)
        .eq('integration_type', type);

    if (error) {
        console.error('Error deleting integration:', error);
        throw error;
    }
}

/**
 * Toggle integration enabled/disabled
 */
export async function toggleIntegration(type: IntegrationType, enabled: boolean): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error('User not authenticated');
    }

    const { error } = await supabase
        .from('user_integrations')
        .update({ is_enabled: enabled })
        .eq('user_id', user.id)
        .eq('integration_type', type);

    if (error) {
        console.error('Error toggling integration:', error);
        throw error;
    }
}

/**
 * Update integration error status
 */
export async function updateIntegrationError(type: IntegrationType, error: string | null): Promise<void> {
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('user_integrations')
        .update({
            last_error: error,
            last_verified_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('integration_type', type);
}

/**
 * Verify GitHub integration by making a test API call
 */
export async function verifyGitHubIntegration(config: GitHubConfig): Promise<{ success: boolean; error?: string; username?: string }> {
    try {
        const token = config.type === 'oauth' ? config.access_token : config.pat;
        if (!token) {
            return { success: false, error: 'No token provided' };
        }

        const response = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            return { success: false, error: `GitHub API error: ${response.status} - ${error}` };
        }

        const user = await response.json();
        return { success: true, username: user.login };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to verify' };
    }
}

/**
 * Verify Prometheus integration by making a test query
 */
export async function verifyPrometheusIntegration(config: PrometheusConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `${config.url}/api/v1/query?query=up`;

        const headers: HeadersInit = { Accept: 'application/json' };
        if (config.username && config.password) {
            headers.Authorization = `Basic ${btoa(`${config.username}:${config.password}`)}`;
        }

        const response = await fetch(url, { headers });

        if (!response.ok) {
            return { success: false, error: `Prometheus error: ${response.status}` };
        }

        const data = await response.json();
        if (data.status !== 'success') {
            return { success: false, error: data.error || 'Query failed' };
        }

        return { success: true };
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Failed to connect' };
    }
}

/**
 * Verify Kubernetes integration by listing namespaces
 */
export async function verifyKubernetesIntegration(config: KubernetesConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const validation = validateAndNormalizeKubernetesConfig(config);
        if (!validation.success || !validation.config) {
            return {
                success: false,
                error: validation.error || 'Kubernetes security validation failed',
            };
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${validation.config.clusterUrl}/api/v1/namespaces?limit=20`, {
            headers: {
                Authorization: `Bearer ${validation.config.token}`,
                Accept: 'application/json',
            },
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
            return { success: false, error: `Kubernetes API error: ${response.status}` };
        }

        const data = await response.json();
        if (!Array.isArray(data.items)) {
            return { success: false, error: 'Unexpected Kubernetes response format' };
        }

        const responseNamespaces = data.items
            .map((item: { metadata?: { name?: string } }) => item.metadata?.name?.toLowerCase())
            .filter((namespace: string | undefined): namespace is string => Boolean(namespace));

        const hasDefaultNamespace = responseNamespaces.includes(validation.config.defaultNamespace);
        if (!hasDefaultNamespace) {
            return {
                success: false,
                error: `Default namespace "${validation.config.defaultNamespace}" is not visible with this token.`,
            };
        }

        return { success: true };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return { success: false, error: 'Kubernetes verification timed out after 10 seconds' };
        }
        return { success: false, error: error instanceof Error ? error.message : 'Failed to connect' };
    }
}

/**
 * Get integration status summary for display
 */
export async function getIntegrationsSummary(): Promise<Array<{
    type: IntegrationType;
    name: string;
    connected: boolean;
    enabled: boolean;
    lastVerified?: string;
    error?: string;
}>> {
    const integrations = await getUserIntegrations();

    const INTEGRATION_NAMES: Record<IntegrationType, string> = {
        github: 'GitHub',
        prometheus: 'Prometheus',
        slack: 'Slack',
        kubernetes: 'Kubernetes',
        pagerduty: 'PagerDuty',
    };

    const allTypes: IntegrationType[] = ['github', 'prometheus', 'slack', 'kubernetes', 'pagerduty'];

    return allTypes.map(type => {
        const integration = integrations.find(i => i.integration_type === type);
        return {
            type,
            name: INTEGRATION_NAMES[type],
            connected: !!integration,
            enabled: integration?.is_enabled ?? false,
            lastVerified: integration?.last_verified_at ?? undefined,
            error: integration?.last_error ?? undefined,
        };
    });
}
