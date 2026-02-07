/**
 * Integration Types
 * Type definitions for user integrations stored in Supabase
 */

export type IntegrationType = 'github' | 'prometheus' | 'slack' | 'kubernetes' | 'pagerduty';

export interface IntegrationBase {
    id: string;
    user_id: string;
    integration_type: IntegrationType;
    is_enabled: boolean;
    last_verified_at: string | null;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}

// GitHub Integration Config
export interface GitHubConfig {
    type: 'oauth' | 'pat';
    // For OAuth
    access_token?: string;
    refresh_token?: string;
    token_expires_at?: string;
    // For Personal Access Token
    pat?: string;
    // Common
    repos?: string[]; // List of repos to monitor
    default_repo?: string;
    username?: string;
}

export interface GitHubIntegration extends IntegrationBase {
    integration_type: 'github';
    config: GitHubConfig;
}

// Prometheus Integration Config
export interface PrometheusConfig {
    url: string;
    // Optional auth (some Prometheus instances require it)
    username?: string;
    password?: string;
    // TLS options
    skip_tls_verify?: boolean;
}

export interface PrometheusIntegration extends IntegrationBase {
    integration_type: 'prometheus';
    config: PrometheusConfig;
}

// Slack Integration Config
export interface SlackConfig {
    type: 'oauth';
    access_token: string;
    team_id: string;
    team_name: string;
    default_channel?: string;
    channels?: Array<{ id: string; name: string }>;
}

export interface SlackIntegration extends IntegrationBase {
    integration_type: 'slack';
    config: SlackConfig;
}

// Kubernetes Integration Config
export interface KubernetesConfig {
    type: 'kubeconfig' | 'service_account';
    // Cluster info
    cluster_name: string;
    cluster_url: string;
    // Auth
    token?: string;
    ca_cert?: string;
    // Namespaces to monitor
    namespaces?: string[];
}

export interface KubernetesIntegration extends IntegrationBase {
    integration_type: 'kubernetes';
    config: KubernetesConfig;
}

// PagerDuty Integration Config
export interface PagerDutyConfig {
    api_key: string;
    service_ids?: string[];
    default_escalation_policy?: string;
}

export interface PagerDutyIntegration extends IntegrationBase {
    integration_type: 'pagerduty';
    config: PagerDutyConfig;
}

// Union type for all integrations
export type UserIntegration =
    | GitHubIntegration
    | PrometheusIntegration
    | SlackIntegration
    | KubernetesIntegration
    | PagerDutyIntegration;

// Integration display info
export interface IntegrationInfo {
    type: IntegrationType;
    name: string;
    description: string;
    icon: string;
    features: string[];
    setupType: 'oauth' | 'api_key' | 'url' | 'config';
    oauthProvider?: string; // For OAuth-based integrations
}

export const INTEGRATION_INFO: Record<IntegrationType, IntegrationInfo> = {
    github: {
        type: 'github',
        name: 'GitHub',
        description: 'Connect to analyze commits, PRs, and CI/CD workflows',
        icon: 'github',
        features: ['Commit Analysis', 'PR Monitoring', 'CI/CD Status', 'Issue Tracking'],
        setupType: 'oauth',
        oauthProvider: 'github',
    },
    prometheus: {
        type: 'prometheus',
        name: 'Prometheus',
        description: 'Connect for real-time metrics and alerting',
        icon: 'activity',
        features: ['Service Health', 'Custom Queries', 'Alert Integration', 'Metric Graphs'],
        setupType: 'url',
    },
    slack: {
        type: 'slack',
        name: 'Slack',
        description: 'Get incident context from team discussions',
        icon: 'message-square',
        features: ['Channel History', 'Incident Threads', 'Team Context', 'Notifications'],
        setupType: 'oauth',
        oauthProvider: 'slack',
    },
    kubernetes: {
        type: 'kubernetes',
        name: 'Kubernetes',
        description: 'Connect for pod management and rollout control',
        icon: 'box',
        features: ['Pod Status', 'Deployments', 'Rollbacks', 'Log Access'],
        setupType: 'config',
    },
    pagerduty: {
        type: 'pagerduty',
        name: 'PagerDuty',
        description: 'Sync incidents and on-call schedules',
        icon: 'bell',
        features: ['Incident Sync', 'On-Call Info', 'Escalations', 'Notifications'],
        setupType: 'api_key',
    },
};
