/**
 * Integration Configuration
 * Manages connections to external services like GitHub, Prometheus, Slack, etc.
 * Fetches credentials from Supabase (user-configured) with fallback to environment variables (dev mode)
 */

import { getIntegration } from "@/services/integration-service";
import type {
    IntegrationType,
    GitHubConfig,
    PrometheusConfig,
    SlackConfig,
    KubernetesConfig,
    PagerDutyConfig,
} from "@/types/integrations";

export interface IntegrationConfig {
    github: {
        enabled: boolean;
        token?: string;
        repos?: string[];
        defaultRepo?: string;
        username?: string;
    };
    prometheus: {
        enabled: boolean;
        url?: string;
        username?: string;
        password?: string;
    };
    slack: {
        enabled: boolean;
        accessToken?: string;
        teamName?: string;
        defaultChannel?: string;
    };
    kubernetes: {
        enabled: boolean;
        clusterUrl?: string;
        token?: string;
    };
    pagerduty: {
        enabled: boolean;
        apiKey?: string;
        serviceIds?: string[];
    };
}

/**
 * Get integration configuration from Supabase
 * Falls back to environment variables for development/admin use
 */
export async function getIntegrationConfig(): Promise<IntegrationConfig> {
    // Initialize with defaults
    const config: IntegrationConfig = {
        github: { enabled: false },
        prometheus: { enabled: false },
        slack: { enabled: false },
        kubernetes: { enabled: false },
        pagerduty: { enabled: false },
    };

    try {
        // Try to get GitHub from Supabase
        const githubIntegration = await getIntegration('github');
        if (githubIntegration?.is_enabled) {
            const ghConfig = githubIntegration.config as GitHubConfig;
            config.github = {
                enabled: true,
                token: ghConfig.type === 'oauth' ? ghConfig.access_token : ghConfig.pat,
                repos: ghConfig.repos,
                defaultRepo: ghConfig.default_repo,
                username: ghConfig.username,
            };
        }
    } catch {
        // Fall back to env vars for development
        if (process.env.GITHUB_TOKEN) {
            const [owner, repo] = (process.env.GITHUB_REPO || '').split('/');
            config.github = {
                enabled: true,
                token: process.env.GITHUB_TOKEN,
                repos: process.env.GITHUB_REPO ? [process.env.GITHUB_REPO] : [],
                defaultRepo: repo,
                username: owner,
            };
        }
    }

    try {
        // Try to get Prometheus from Supabase
        const prometheusIntegration = await getIntegration('prometheus');
        if (prometheusIntegration?.is_enabled) {
            const promConfig = prometheusIntegration.config as PrometheusConfig;
            config.prometheus = {
                enabled: true,
                url: promConfig.url,
                username: promConfig.username,
                password: promConfig.password,
            };
        }
    } catch {
        // Fall back to env vars
        if (process.env.PROMETHEUS_URL) {
            config.prometheus = {
                enabled: true,
                url: process.env.PROMETHEUS_URL,
            };
        }
    }

    try {
        // Try to get Slack from Supabase
        const slackIntegration = await getIntegration('slack');
        if (slackIntegration?.is_enabled) {
            const slackConfig = slackIntegration.config as SlackConfig;
            config.slack = {
                enabled: true,
                accessToken: slackConfig.access_token,
                teamName: slackConfig.team_name,
                defaultChannel: slackConfig.default_channel,
            };
        }
    } catch {
        // Fall back to env vars
        if (process.env.SLACK_BOT_TOKEN) {
            config.slack = {
                enabled: true,
                accessToken: process.env.SLACK_BOT_TOKEN,
                defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#incidents',
            };
        }
    }

    try {
        // Try to get Kubernetes from Supabase
        const k8sIntegration = await getIntegration('kubernetes');
        if (k8sIntegration?.is_enabled) {
            const k8sConfig = k8sIntegration.config as KubernetesConfig;
            config.kubernetes = {
                enabled: true,
                clusterUrl: k8sConfig.cluster_url,
                token: k8sConfig.token,
            };
        }
    } catch {
        // No env var fallback for k8s in browser context
    }

    try {
        // Try to get PagerDuty from Supabase
        const pdIntegration = await getIntegration('pagerduty');
        if (pdIntegration?.is_enabled) {
            const pdConfig = pdIntegration.config as PagerDutyConfig;
            config.pagerduty = {
                enabled: true,
                apiKey: pdConfig.api_key,
                serviceIds: pdConfig.service_ids,
            };
        }
    } catch {
        // Fall back to env vars
        if (process.env.PAGERDUTY_API_KEY) {
            config.pagerduty = {
                enabled: true,
                apiKey: process.env.PAGERDUTY_API_KEY,
            };
        }
    }

    return config;
}

/**
 * Get available integrations (quick check without full config)
 */
export async function getAvailableIntegrations(): Promise<IntegrationType[]> {
    const config = await getIntegrationConfig();
    const available: IntegrationType[] = [];

    if (config.github.enabled) available.push("github");
    if (config.prometheus.enabled) available.push("prometheus");
    if (config.slack.enabled) available.push("slack");
    if (config.kubernetes.enabled) available.push("kubernetes");
    if (config.pagerduty.enabled) available.push("pagerduty");

    return available;
}

/**
 * Get integration status for display in UI
 */
export async function getIntegrationStatus(): Promise<Array<{
    name: string;
    enabled: boolean;
    status: "connected" | "disconnected" | "error";
    details?: string;
}>> {
    const config = await getIntegrationConfig();

    return [
        {
            name: "GitHub",
            enabled: config.github.enabled,
            status: config.github.enabled ? "connected" : "disconnected",
            details: config.github.enabled
                ? `${config.github.username}${config.github.repos?.length ? ` (${config.github.repos.length} repos)` : ''}`
                : "Not configured - Go to Settings to connect",
        },
        {
            name: "Prometheus",
            enabled: config.prometheus.enabled,
            status: config.prometheus.enabled ? "connected" : "disconnected",
            details: config.prometheus.enabled
                ? config.prometheus.url
                : "Not configured - Go to Settings to connect",
        },
        {
            name: "Slack",
            enabled: config.slack.enabled,
            status: config.slack.enabled ? "connected" : "disconnected",
            details: config.slack.enabled
                ? config.slack.teamName || config.slack.defaultChannel
                : "Not configured - Go to Settings to connect",
        },
        {
            name: "Kubernetes",
            enabled: config.kubernetes.enabled,
            status: config.kubernetes.enabled ? "connected" : "disconnected",
            details: config.kubernetes.enabled
                ? "Cluster connected"
                : "Not configured - Go to Settings to connect",
        },
        {
            name: "PagerDuty",
            enabled: config.pagerduty.enabled,
            status: config.pagerduty.enabled ? "connected" : "disconnected",
            details: config.pagerduty.enabled
                ? `${config.pagerduty.serviceIds?.length || 0} services monitored`
                : "Not configured - Go to Settings to connect",
        },
    ];
}
