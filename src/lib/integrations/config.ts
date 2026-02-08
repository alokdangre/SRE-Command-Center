/**
 * Integration Configuration
 * Manages connections to external services like GitHub, Prometheus, Slack, etc.
 * Fetches credentials from Supabase (user-configured).
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
        defaultNamespace?: string;
        allowedNamespaces?: string[];
        caCert?: string;
        skipTlsVerify?: boolean;
    };
    pagerduty: {
        enabled: boolean;
        apiKey?: string;
        serviceIds?: string[];
    };
}

function normalizeRepoFullName(repo: string, username?: string): string {
    const trimmed = repo.trim();
    if (!trimmed) return "";
    if (trimmed.includes("/")) return trimmed;
    if (username) return `${username}/${trimmed}`;
    return trimmed;
}

/**
 * Get integration configuration from Supabase
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
        const githubIntegration = await getIntegration('github');
        if (githubIntegration?.is_enabled) {
            const ghConfig = githubIntegration.config as GitHubConfig;
            const token = ghConfig.type === 'oauth' ? ghConfig.access_token : ghConfig.pat;
            const repos = (ghConfig.repos || [])
                .map(repo => normalizeRepoFullName(repo, ghConfig.username))
                .filter(Boolean);
            const normalizedDefaultRepo = ghConfig.default_repo
                ? normalizeRepoFullName(ghConfig.default_repo, ghConfig.username)
                : repos[0];
            const hasRepo = Boolean(normalizedDefaultRepo || repos.length > 0);

            config.github = {
                enabled: Boolean(token && hasRepo),
                token,
                repos,
                defaultRepo: normalizedDefaultRepo || undefined,
                username: ghConfig.username,
            };
        }
    } catch {
        // Ignore transient integration fetch errors and keep disabled state.
    }

    try {
        const prometheusIntegration = await getIntegration('prometheus');
        if (prometheusIntegration?.is_enabled) {
            const promConfig = prometheusIntegration.config as PrometheusConfig;
            config.prometheus = {
                enabled: Boolean(promConfig.url),
                url: promConfig.url,
                username: promConfig.username,
                password: promConfig.password,
            };
        }
    } catch {
        // Ignore transient integration fetch errors and keep disabled state.
    }

    try {
        const slackIntegration = await getIntegration('slack');
        if (slackIntegration?.is_enabled) {
            const slackConfig = slackIntegration.config as SlackConfig;
            config.slack = {
                enabled: Boolean(slackConfig.access_token),
                accessToken: slackConfig.access_token,
                teamName: slackConfig.team_name,
                defaultChannel: slackConfig.default_channel,
            };
        }
    } catch {
        // Ignore transient integration fetch errors and keep disabled state.
    }

    try {
        const k8sIntegration = await getIntegration('kubernetes');
        if (k8sIntegration?.is_enabled) {
            const k8sConfig = k8sIntegration.config as KubernetesConfig;
            config.kubernetes = {
                enabled: Boolean(k8sConfig.cluster_url && k8sConfig.token),
                clusterUrl: k8sConfig.cluster_url,
                token: k8sConfig.token,
                defaultNamespace: k8sConfig.default_namespace,
                allowedNamespaces: k8sConfig.namespaces,
                caCert: k8sConfig.ca_cert,
                skipTlsVerify: Boolean(k8sConfig.skip_tls_verify),
            };
        }
    } catch {
        // Ignore transient integration fetch errors and keep disabled state.
    }

    try {
        const pdIntegration = await getIntegration('pagerduty');
        if (pdIntegration?.is_enabled) {
            const pdConfig = pdIntegration.config as PagerDutyConfig;
            config.pagerduty = {
                enabled: Boolean(pdConfig.api_key),
                apiKey: pdConfig.api_key,
                serviceIds: pdConfig.service_ids,
            };
        }
    } catch {
        // Ignore transient integration fetch errors and keep disabled state.
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
            status: config.github.enabled
                ? "connected"
                : config.github.token
                    ? "error"
                    : "disconnected",
            details: config.github.enabled
                ? `${config.github.defaultRepo || config.github.repos?.[0] || config.github.username || "GitHub connected"}`
                : config.github.token
                    ? "Connected to GitHub account, but repository is not configured. Go to Settings > GitHub."
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
