/**
 * SRE Tools for Tambo AI
 * These functions are called by the AI to analyze incidents and suggest remediations
 */

import {
    mockServices,
    mockAlerts,
    mockIncident,
    mockRecentCommits,
    mockHealthMetrics,
    mockRemediationActions,
    mockSlackMessages,
    mockRootCauseAnalysis,
    getSystemStatus,
} from './mock-data';

/**
 * Get the current system status overview
 */
export async function getSystemOverview() {
    const status = getSystemStatus();
    return {
        overallStatus: status.overall,
        totalServices: status.services.length,
        healthyServices: status.services.filter(s => s.status === 'healthy').length,
        degradedServices: status.services.filter(s => s.status === 'degraded').length,
        criticalServices: status.services.filter(s => s.status === 'critical').length,
        activeAlerts: status.activeAlerts,
        activeIncidents: status.activeIncidents,
        lastUpdated: status.lastUpdated.toISOString(),
    };
}

/**
 * Get details about all services
 */
export async function getServiceStatus(params: { serviceName?: string }) {
    if (params.serviceName) {
        const service = mockServices.find(
            s => s.name.toLowerCase().includes(params.serviceName!.toLowerCase())
        );
        return service ? [service] : [];
    }
    return mockServices.map(s => ({
        ...s,
        lastDeployment: s.lastDeployment?.toISOString(),
    }));
}

/**
 * Get active alerts with optional filtering
 */
export async function getActiveAlerts(params: {
    severity?: 'critical' | 'warning' | 'info';
    service?: string;
}) {
    let alerts = mockAlerts;

    if (params.severity) {
        alerts = alerts.filter(a => a.severity === params.severity);
    }

    if (params.service) {
        alerts = alerts.filter(a =>
            a.service.toLowerCase().includes(params.service!.toLowerCase())
        );
    }

    return alerts.map(a => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
    }));
}

/**
 * Get current incident details
 */
export async function getCurrentIncident() {
    return {
        ...mockIncident,
        startTime: mockIncident.startTime.toISOString(),
        endTime: mockIncident.endTime?.toISOString(),
        timeline: mockIncident.timeline.map(e => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
        })),
        duration: Math.round((Date.now() - mockIncident.startTime.getTime()) / 60000),
    };
}

/**
 * Analyze recent commits for potential breaking changes
 */
export async function analyzeRecentCommits(params: {
    service?: string;
    hoursBack?: number;
}) {
    const commits = mockRecentCommits.map(c => ({
        ...c,
        timestamp: c.timestamp.toISOString(),
        isBreakingChange: c.message.includes('BREAKING CHANGE'),
        affectsConfiguration: c.files.some(f => f.includes('config') || f.includes('.yaml')),
        isLargeChange: c.additions + c.deletions > 200,
    }));

    return {
        commits,
        suspiciousCommits: commits.filter(c => c.isBreakingChange || c.isLargeChange),
        summary: `Found ${commits.length} recent commits, ${commits.filter(c => c.isBreakingChange).length} with breaking changes`,
    };
}

/**
 * Get health metrics for the system
 */
export async function getHealthMetrics(params: { metricName?: string }) {
    let metrics = mockHealthMetrics;

    if (params.metricName) {
        metrics = metrics.filter(m =>
            m.name.toLowerCase().includes(params.metricName!.toLowerCase())
        );
    }

    return metrics.map(m => ({
        ...m,
        status: getMetricStatus(m),
    }));
}

function getMetricStatus(metric: typeof mockHealthMetrics[0]): 'ok' | 'warning' | 'critical' {
    if (!metric.threshold) return 'ok';
    if (metric.value >= metric.threshold.critical) return 'critical';
    if (metric.value >= metric.threshold.warning) return 'warning';
    return 'ok';
}

/**
 * Get available remediation actions
 */
export async function getRemediationOptions(params: { riskLevel?: 'low' | 'medium' | 'high' }) {
    let actions = mockRemediationActions;

    if (params.riskLevel) {
        actions = actions.filter(a => a.risk === params.riskLevel);
    }

    return actions;
}

/**
 * Simulate executing a remediation action
 */
export async function executeRemediation(params: { actionId: string }) {
    const action = mockRemediationActions.find(a => a.id === params.actionId);

    if (!action) {
        return { success: false, error: 'Action not found' };
    }

    if (!action.enabled) {
        return { success: false, error: 'Action is not enabled' };
    }

    // Simulate execution
    return {
        success: true,
        action: action.name,
        message: `Successfully initiated: ${action.name}`,
        steps: action.steps,
        estimatedCompletion: '2 minutes',
    };
}

/**
 * Get Slack discussion context about the incident
 */
export async function getSlackContext(params: { channel?: string }) {
    let messages = mockSlackMessages;

    if (params.channel) {
        messages = messages.filter(m => m.channel === params.channel);
    }

    return {
        messages: messages.map(m => ({
            ...m,
            timestamp: m.timestamp.toISOString(),
        })),
        summary: 'Team discussion indicates awareness of batch processing changes and potential memory issues',
    };
}

/**
 * Get AI-powered root cause analysis
 */
export async function getRootCauseAnalysis() {
    return mockRootCauseAnalysis;
}

/**
 * Generate incident timeline data for visualization
 */
export async function getIncidentTimelineData() {
    const timeline = mockIncident.timeline.map(e => ({
        time: e.timestamp.toISOString(),
        event: e.description,
        type: e.type,
        author: e.author || 'System',
    }));

    // Add metric data points
    const metricPoints = [
        { time: new Date(Date.now() - 20 * 60000).toISOString(), errorRate: 0.5, memory: 65 },
        { time: new Date(Date.now() - 15 * 60000).toISOString(), errorRate: 5.2, memory: 78 },
        { time: new Date(Date.now() - 10 * 60000).toISOString(), errorRate: 12.4, memory: 88 },
        { time: new Date(Date.now() - 5 * 60000).toISOString(), errorRate: 15.8, memory: 95 },
        { time: new Date().toISOString(), errorRate: 14.2, memory: 93 },
    ];

    return { timeline, metricPoints };
}

/**
 * Get anomaly data for heatmap visualization
 */
export async function getAnomalyHeatmapData() {
    const services = ['API Gateway', 'Auth Service', 'Payment', 'Notification', 'Database', 'Cache', 'Search', 'CDN'];
    const timeSlots = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];

    const data = services.map(service => ({
        service,
        anomalies: timeSlots.map(time => ({
            time,
            score: service === 'Notification' && time === '16:00' ? 95 : Math.random() * 30,
        })),
    }));

    return data;
}
