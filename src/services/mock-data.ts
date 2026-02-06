/**
 * Mock data service for SRE Command Center
 * Simulates realistic infrastructure data for demonstration
 */

import type {
    Alert,
    Service,
    Incident,
    Commit,
    HealthMetric,
    RemediationAction,
    SystemStatus,
} from '@/types/sre';

// Generate realistic timestamps
const now = new Date();
const minutesAgo = (mins: number) => new Date(now.getTime() - mins * 60 * 1000);
const hoursAgo = (hours: number) => minutesAgo(hours * 60);
const daysAgo = (days: number) => hoursAgo(days * 24);

// Service data
export const mockServices: Service[] = [
    {
        id: 'svc-api-gateway',
        name: 'API Gateway',
        status: 'healthy',
        uptime: 99.99,
        latency: 45,
        errorRate: 0.02,
        requestsPerSecond: 12500,
        lastDeployment: hoursAgo(2),
        version: 'v2.4.1',
    },
    {
        id: 'svc-auth-service',
        name: 'Authentication Service',
        status: 'healthy',
        uptime: 99.95,
        latency: 120,
        errorRate: 0.05,
        requestsPerSecond: 3200,
        lastDeployment: daysAgo(1),
        version: 'v1.8.3',
    },
    {
        id: 'svc-payment-processor',
        name: 'Payment Processor',
        status: 'degraded',
        uptime: 98.5,
        latency: 890,
        errorRate: 2.3,
        requestsPerSecond: 850,
        lastDeployment: hoursAgo(6),
        version: 'v3.1.0',
    },
    {
        id: 'svc-user-database',
        name: 'User Database',
        status: 'healthy',
        uptime: 99.99,
        latency: 15,
        errorRate: 0.01,
        requestsPerSecond: 8500,
        lastDeployment: daysAgo(7),
        version: 'v4.2.0',
    },
    {
        id: 'svc-cache-cluster',
        name: 'Redis Cache Cluster',
        status: 'healthy',
        uptime: 99.99,
        latency: 2,
        errorRate: 0.001,
        requestsPerSecond: 45000,
        lastDeployment: daysAgo(14),
        version: 'v7.2.4',
    },
    {
        id: 'svc-notification',
        name: 'Notification Service',
        status: 'critical',
        uptime: 94.2,
        latency: 2500,
        errorRate: 15.8,
        requestsPerSecond: 120,
        lastDeployment: minutesAgo(45),
        version: 'v2.0.0-beta',
    },
    {
        id: 'svc-search-engine',
        name: 'Search Engine',
        status: 'healthy',
        uptime: 99.8,
        latency: 180,
        errorRate: 0.3,
        requestsPerSecond: 2100,
        lastDeployment: daysAgo(3),
        version: 'v5.1.2',
    },
    {
        id: 'svc-cdn',
        name: 'CDN Edge',
        status: 'healthy',
        uptime: 99.99,
        latency: 25,
        errorRate: 0.01,
        requestsPerSecond: 95000,
        lastDeployment: daysAgo(30),
        version: 'v1.2.0',
    },
];

// Active alerts
export const mockAlerts: Alert[] = [
    {
        id: 'alert-001',
        severity: 'critical',
        title: 'Notification Service High Error Rate',
        description: 'Error rate exceeded 15% threshold for the past 10 minutes',
        service: 'Notification Service',
        timestamp: minutesAgo(12),
        status: 'firing',
        source: 'Prometheus',
        labels: {
            alertname: 'HighErrorRate',
            instance: 'notification-svc-pod-3',
            namespace: 'production',
        },
    },
    {
        id: 'alert-002',
        severity: 'critical',
        title: 'Notification Service Memory Pressure',
        description: 'Container memory usage at 95% - OOMKill imminent',
        service: 'Notification Service',
        timestamp: minutesAgo(8),
        status: 'firing',
        source: 'Kubernetes',
        labels: {
            alertname: 'HighMemoryUsage',
            pod: 'notification-svc-pod-3',
            container: 'main',
        },
    },
    {
        id: 'alert-003',
        severity: 'warning',
        title: 'Payment Processor Latency Spike',
        description: 'P99 latency increased to 890ms (threshold: 500ms)',
        service: 'Payment Processor',
        timestamp: minutesAgo(25),
        status: 'acknowledged',
        source: 'Datadog',
        labels: {
            alertname: 'HighLatency',
            environment: 'production',
            region: 'us-east-1',
        },
    },
    {
        id: 'alert-004',
        severity: 'warning',
        title: 'Database Connection Pool Near Limit',
        description: 'Connection pool at 85% capacity (170/200 connections)',
        service: 'User Database',
        timestamp: minutesAgo(5),
        status: 'firing',
        source: 'PostgreSQL',
        labels: {
            alertname: 'ConnectionPoolWarning',
            database: 'users_primary',
        },
    },
    {
        id: 'alert-005',
        severity: 'info',
        title: 'Scheduled Maintenance Window',
        description: 'Cache cluster rolling restart scheduled in 4 hours',
        service: 'Redis Cache Cluster',
        timestamp: hoursAgo(1),
        status: 'acknowledged',
        source: 'Maintenance',
        labels: {
            alertname: 'MaintenanceScheduled',
            type: 'rolling-restart',
        },
    },
];

// Current incident
export const mockIncident: Incident = {
    id: 'inc-2024-001',
    title: 'Notification Service Degradation',
    severity: 'critical',
    status: 'investigating',
    startTime: minutesAgo(15),
    affectedServices: ['Notification Service', 'API Gateway'],
    assignee: 'On-Call Engineer',
    timeline: [
        {
            id: 'evt-1',
            timestamp: minutesAgo(15),
            type: 'alert',
            description: 'PagerDuty alert triggered for high error rate on Notification Service',
        },
        {
            id: 'evt-2',
            timestamp: minutesAgo(12),
            type: 'action',
            description: 'On-call engineer acknowledged the alert',
            author: 'ops-bot',
        },
        {
            id: 'evt-3',
            timestamp: minutesAgo(10),
            type: 'note',
            description: 'Initial investigation: Memory usage spiking after v2.0.0-beta deployment',
            author: 'On-Call Engineer',
        },
        {
            id: 'evt-4',
            timestamp: minutesAgo(5),
            type: 'action',
            description: 'Scaled pods from 3 to 5 replicas as temporary mitigation',
            author: 'On-Call Engineer',
        },
    ],
};

// Recent commits (simulating GitHub integration)
export const mockRecentCommits: Commit[] = [
    {
        sha: 'a1b2c3d',
        message: 'feat: Add batch processing for notifications - BREAKING CHANGE',
        author: 'developer-1',
        timestamp: hoursAgo(1),
        files: ['src/batch-processor.ts', 'src/queue-handler.ts', 'config/batch.yaml'],
        additions: 450,
        deletions: 120,
    },
    {
        sha: 'e4f5g6h',
        message: 'chore: Update dependencies',
        author: 'dependabot',
        timestamp: hoursAgo(2),
        files: ['package.json', 'package-lock.json'],
        additions: 1200,
        deletions: 1100,
    },
    {
        sha: 'i7j8k9l',
        message: 'fix: Memory leak in notification queue handler',
        author: 'developer-2',
        timestamp: hoursAgo(6),
        files: ['src/queue-handler.ts'],
        additions: 15,
        deletions: 8,
    },
    {
        sha: 'm0n1o2p',
        message: 'feat: Add metrics endpoint for batch processing',
        author: 'developer-1',
        timestamp: hoursAgo(8),
        files: ['src/metrics.ts', 'src/batch-processor.ts'],
        additions: 85,
        deletions: 10,
    },
];

// Health metrics
export const mockHealthMetrics: HealthMetric[] = [
    {
        name: 'CPU Usage',
        value: 72,
        unit: '%',
        trend: 'up',
        threshold: { warning: 70, critical: 90 },
    },
    {
        name: 'Memory Usage',
        value: 95,
        unit: '%',
        trend: 'up',
        threshold: { warning: 80, critical: 95 },
    },
    {
        name: 'Disk I/O',
        value: 45,
        unit: '%',
        trend: 'stable',
        threshold: { warning: 70, critical: 85 },
    },
    {
        name: 'Network Throughput',
        value: 850,
        unit: 'MB/s',
        trend: 'down',
        threshold: { warning: 900, critical: 950 },
    },
    {
        name: 'Request Queue',
        value: 12500,
        unit: 'msgs',
        trend: 'up',
        threshold: { warning: 10000, critical: 20000 },
    },
    {
        name: 'Active Connections',
        value: 4200,
        unit: 'conn',
        trend: 'stable',
        threshold: { warning: 5000, critical: 8000 },
    },
];

// Remediation actions
export const mockRemediationActions: RemediationAction[] = [
    {
        id: 'rem-001',
        name: 'Rollback Deployment',
        description: 'Rollback Notification Service to previous stable version (v1.9.2)',
        type: 'automatic',
        risk: 'medium',
        estimatedImpact: 'Service will be temporarily unavailable during rollback (~30s)',
        steps: [
            'Pause incoming traffic to Notification Service',
            'Scale down current deployment',
            'Deploy v1.9.2 from container registry',
            'Run health checks',
            'Resume traffic routing',
        ],
        enabled: true,
    },
    {
        id: 'rem-002',
        name: 'Scale Horizontal',
        description: 'Add 5 additional pods to handle increased load',
        type: 'automatic',
        risk: 'low',
        estimatedImpact: 'Increased resource costs, ~2 min for new pods to be ready',
        steps: [
            'Request additional compute resources',
            'Deploy 5 new pods',
            'Wait for health checks',
            'Update load balancer configuration',
        ],
        enabled: true,
    },
    {
        id: 'rem-003',
        name: 'Enable Safe Mode',
        description: 'Reduce non-essential features, prioritize core notification delivery',
        type: 'automatic',
        risk: 'low',
        estimatedImpact: 'Analytics and tracking features will be disabled',
        steps: [
            'Update feature flags',
            'Disable batch processing',
            'Enable rate limiting',
            'Notify downstream services',
        ],
        enabled: false,
    },
    {
        id: 'rem-004',
        name: 'Traffic Shift (Canary)',
        description: 'Shift 50% traffic to backup region us-west-2',
        type: 'manual',
        risk: 'high',
        estimatedImpact: 'Increased latency for users in east coast, requires manual monitoring',
        steps: [
            'Verify backup region health',
            'Update DNS weights',
            'Monitor error rates in both regions',
            'Adjust traffic split as needed',
        ],
        enabled: true,
    },
    {
        id: 'rem-005',
        name: 'Restart Service Pods',
        description: 'Perform rolling restart of all Notification Service pods',
        type: 'automatic',
        risk: 'low',
        estimatedImpact: 'Brief capacity reduction during restart (~60s)',
        steps: [
            'Initiate rolling restart',
            'Wait for each pod to become healthy',
            'Verify all pods running new instances',
        ],
        enabled: true,
    },
];

// System status summary
export function getSystemStatus(): SystemStatus {
    const criticalServices = mockServices.filter(s => s.status === 'critical').length;
    const degradedServices = mockServices.filter(s => s.status === 'degraded').length;

    let overall: SystemStatus['overall'] = 'operational';
    if (criticalServices > 0) overall = 'outage';
    else if (degradedServices > 0) overall = 'degraded';

    return {
        overall,
        services: mockServices,
        activeAlerts: mockAlerts.filter(a => a.status === 'firing').length,
        activeIncidents: 1,
        lastUpdated: new Date(),
    };
}

// Simulated Slack messages about the incident
export const mockSlackMessages = [
    {
        channel: '#incidents',
        author: 'PagerDuty Bot',
        timestamp: minutesAgo(14),
        message: '🚨 *CRITICAL ALERT* - Notification Service error rate at 15.8%',
    },
    {
        channel: '#incidents',
        author: 'on-call-engineer',
        timestamp: minutesAgo(12),
        message: 'Acknowledged. Looking into this now.',
    },
    {
        channel: '#incidents',
        author: 'developer-1',
        timestamp: minutesAgo(8),
        message: 'This might be related to my batch processing PR that was merged earlier. The new queue handler has higher memory requirements.',
    },
    {
        channel: '#incidents',
        author: 'sre-lead',
        timestamp: minutesAgo(6),
        message: 'Can we get a rollback ready? @developer-1 can you help test v1.9.2 compatibility?',
    },
    {
        channel: '#incidents',
        author: 'developer-1',
        timestamp: minutesAgo(4),
        message: 'Yes, rollback should be safe. The batch processor is backwards compatible with the old queue format.',
    },
];

// Root cause analysis data
export const mockRootCauseAnalysis = {
    suspectedCause: 'Memory leak in batch notification processor introduced in v2.0.0-beta',
    confidence: 87,
    evidence: [
        'Memory usage correlates with deployment time of v2.0.0-beta (45 minutes ago)',
        'Recent commit a1b2c3d introduces new batch processing logic with large buffer allocations',
        'Slack conversation indicates developer awareness of higher memory requirements',
        'Previous fix for memory leak (commit i7j8k9l) may have been incomplete',
    ],
    recommendedAction: 'Rollback to v1.9.2 and investigate batch processor memory allocation patterns',
};
