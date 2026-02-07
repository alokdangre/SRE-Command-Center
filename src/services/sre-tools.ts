/**
 * SRE Tools for Tambo AI
 * These functions are called by the AI to analyze incidents and suggest remediations
 * 
 * Uses real integrations when configured, falls back to mock data otherwise.
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

import {
    getIntegrationConfig,
    getIntegrationStatus,
    analyzeGitHubCommits,
    fetchPrometheusAlerts,
    getServiceHealth,
    getHealthMetrics as getPrometheusHealthMetrics,
    getPagerDutyIncidents,
    getIncidentTimeline as getPagerDutyIncidentTimeline,
} from '@/lib/integrations';

/**
 * Get the current system status overview
 */
export async function getSystemOverview() {
    const config = await getIntegrationConfig();
    const integrations = await getIntegrationStatus();

    // Try to get real data if Prometheus is configured
    if (config.prometheus.enabled) {
        const { services, error } = await getServiceHealth();

        if (!error && services.length > 0) {
            const healthyServices = services.filter(s => s.status === 'healthy').length;
            const degradedServices = services.filter(s => s.status === 'degraded').length;
            const criticalServices = services.filter(s => s.status === 'critical').length;

            // Get alerts
            const { alerts } = await fetchPrometheusAlerts();

            return {
                overallStatus: criticalServices > 0 ? 'critical' : degradedServices > 0 ? 'degraded' : 'healthy',
                totalServices: services.length,
                healthyServices,
                degradedServices,
                criticalServices,
                activeAlerts: alerts.filter(a => a.state === 'firing').length,
                activeIncidents: alerts.filter(a => a.state === 'firing' && a.severity === 'critical').length,
                lastUpdated: new Date().toISOString(),
                dataSource: 'prometheus',
                integrations,
            };
        }
    }

    // Fall back to mock data
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
        dataSource: 'mock',
        integrations,
    };
}

/**
 * Get details about all services
 */
export async function getServiceStatus(params: { serviceName?: string }) {
    const config = await getIntegrationConfig();

    // Try Prometheus first
    if (config.prometheus.enabled) {
        const { services, error } = await getServiceHealth(params.serviceName);

        if (!error && services.length > 0) {
            return {
                services: services.map(s => ({
                    name: s.name,
                    status: s.status,
                    latency: `${Math.round(s.latencyP99)}ms (P99)`,
                    errorRate: `${s.errorRate.toFixed(2)}%`,
                    requestRate: `${Math.round(s.requestRate)}/s`,
                    uptime: s.uptime === 1 ? '100%' : '0%',
                })),
                dataSource: 'prometheus',
            };
        }
    }

    // Fall back to mock data
    if (params.serviceName) {
        const service = mockServices.find(
            s => s.name.toLowerCase().includes(params.serviceName!.toLowerCase())
        );
        return {
            services: service ? [service] : [],
            dataSource: 'mock',
        };
    }

    return {
        services: mockServices.map(s => ({
            ...s,
            lastDeployment: s.lastDeployment?.toISOString(),
        })),
        dataSource: 'mock',
    };
}

/**
 * Get active alerts with optional filtering
 */
export async function getActiveAlerts(params: {
    severity?: 'critical' | 'warning' | 'info';
    service?: string;
}) {
    const config = await getIntegrationConfig();

    // Try Prometheus/Alertmanager first
    if (config.prometheus.enabled) {
        const { alerts, error } = await fetchPrometheusAlerts();

        if (!error && alerts.length > 0) {
            let filtered = alerts.filter(a => a.state === 'firing');

            if (params.severity) {
                filtered = filtered.filter(a => a.severity === params.severity);
            }

            if (params.service) {
                filtered = filtered.filter(a =>
                    a.labels.service?.toLowerCase().includes(params.service!.toLowerCase()) ||
                    a.labels.job?.toLowerCase().includes(params.service!.toLowerCase())
                );
            }

            return {
                alerts: filtered.map(a => ({
                    id: `${a.alertname}-${a.activeAt}`,
                    name: a.alertname,
                    severity: a.severity,
                    service: a.labels.service || a.labels.job || 'unknown',
                    message: a.annotations.summary || a.annotations.description || a.alertname,
                    timestamp: a.activeAt,
                })),
                dataSource: 'prometheus',
            };
        }
    }

    // Fall back to mock data
    let alerts = mockAlerts;

    if (params.severity) {
        alerts = alerts.filter(a => a.severity === params.severity);
    }

    if (params.service) {
        alerts = alerts.filter(a =>
            a.service.toLowerCase().includes(params.service!.toLowerCase())
        );
    }

    return {
        alerts: alerts.map(a => ({
            ...a,
            timestamp: a.timestamp.toISOString(),
        })),
        dataSource: 'mock',
    };
}

/**
 * Get current incident details
 */
export async function getCurrentIncident() {
    const config = await getIntegrationConfig();

    // Try PagerDuty first
    if (config.pagerduty.enabled) {
        const { incidents, error } = await getPagerDutyIncidents({
            statuses: ['triggered', 'acknowledged'],
            limit: 1,
        });

        if (!error && incidents.length > 0) {
            const incident = incidents[0];

            // Get timeline for this incident
            const { timeline } = await getPagerDutyIncidentTimeline(incident.id);

            return {
                id: incident.id,
                number: incident.incidentNumber,
                title: incident.title,
                description: incident.description,
                status: incident.status,
                severity: incident.urgency === 'high' ? 'critical' : 'warning',
                service: incident.service.name,
                assignees: incident.assignees.map(a => a.name),
                startTime: incident.createdAt,
                acknowledgedTime: incident.acknowledgedAt,
                endTime: incident.resolvedAt,
                timeline: timeline.map(e => ({
                    type: e.type,
                    description: e.message,
                    timestamp: e.timestamp,
                    author: e.agent?.name || 'System',
                })),
                duration: Math.round((Date.now() - new Date(incident.createdAt).getTime()) / 60000),
                url: incident.htmlUrl,
                dataSource: 'pagerduty',
            };
        }
    }

    // Fall back to mock data
    return {
        ...mockIncident,
        startTime: mockIncident.startTime.toISOString(),
        endTime: mockIncident.endTime?.toISOString(),
        timeline: mockIncident.timeline.map(e => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
        })),
        duration: Math.round((Date.now() - mockIncident.startTime.getTime()) / 60000),
        dataSource: 'mock',
    };
}

/**
 * Analyze recent commits for potential breaking changes
 */
export async function analyzeRecentCommits(params: {
    service?: string;
    hoursBack?: number;
}) {
    const config = await getIntegrationConfig();

    // Try GitHub first
    if (config.github.enabled) {
        const result = await analyzeGitHubCommits({
            service: params.service,
            hoursBack: params.hoursBack || 24,
        });

        if (!result.error) {
            return {
                commits: result.commits.map(c => ({
                    sha: c.sha,
                    message: c.message,
                    author: c.author,
                    timestamp: c.timestamp,
                    files: c.files,
                    additions: c.additions,
                    deletions: c.deletions,
                    isBreakingChange: c.isBreakingChange,
                    affectsConfiguration: c.affectsConfiguration,
                    isLargeChange: c.isLargeChange,
                    riskLevel: c.riskLevel,
                    url: c.url,
                })),
                suspiciousCommits: result.commits.filter(c => c.riskLevel !== 'low'),
                summary: result.summary,
                dataSource: 'github',
            };
        }
    }

    // Fall back to mock data
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
        dataSource: 'mock',
    };
}

/**
 * Get health metrics for the system
 */
export async function getHealthMetrics(params: { metricName?: string }) {
    const config = await getIntegrationConfig();

    // Try Prometheus first
    if (config.prometheus.enabled) {
        const { metrics, error } = await getPrometheusHealthMetrics({
            metricName: params.metricName,
        });

        if (!error && metrics.length > 0) {
            return {
                metrics,
                dataSource: 'prometheus',
            };
        }
    }

    // Fall back to mock data
    let metrics = mockHealthMetrics;

    if (params.metricName) {
        metrics = metrics.filter(m =>
            m.name.toLowerCase().includes(params.metricName!.toLowerCase())
        );
    }

    return {
        metrics: metrics.map(m => ({
            ...m,
            status: getMetricStatus(m),
        })),
        dataSource: 'mock',
    };
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

    // In a real implementation, this would execute kubectl commands, API calls, etc.
    // For now, simulate execution
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
    // Slack integration would require OAuth and additional setup
    // For now, use mock data
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
        dataSource: 'mock',
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
export async function getIncidentTimelineData(params?: { incidentId?: string }) {
    const config = await getIntegrationConfig();

    // Try PagerDuty first
    if (config.pagerduty.enabled) {
        let incidentId = params?.incidentId;

        // If no incident ID provided, get the most recent active incident
        if (!incidentId) {
            const { incidents } = await getPagerDutyIncidents({
                statuses: ['triggered', 'acknowledged'],
                limit: 1,
            });
            if (incidents.length > 0) {
                incidentId = incidents[0].id;
            }
        }

        if (incidentId) {
            const { timeline, error } = await getPagerDutyIncidentTimeline(incidentId);

            if (!error && timeline.length > 0) {
                // Convert PagerDuty timeline to our format
                const formattedTimeline = timeline.map(e => ({
                    time: e.timestamp,
                    event: e.message,
                    type: e.type,
                    author: e.agent?.name || 'System',
                }));

                // Generate metric points based on timeline (or fetch from Prometheus if configured)
                const firstEvent = new Date(timeline[timeline.length - 1]?.timestamp || Date.now());
                const metricPoints = [
                    { time: new Date(firstEvent.getTime()).toISOString(), errorRate: 0.5, memory: 65 },
                    { time: new Date(firstEvent.getTime() + 5 * 60000).toISOString(), errorRate: 5.2, memory: 78 },
                    { time: new Date(firstEvent.getTime() + 10 * 60000).toISOString(), errorRate: 12.4, memory: 88 },
                    { time: new Date(firstEvent.getTime() + 15 * 60000).toISOString(), errorRate: 15.8, memory: 95 },
                    { time: new Date().toISOString(), errorRate: 14.2, memory: 93 },
                ];

                return {
                    timeline: formattedTimeline,
                    metricPoints,
                    dataSource: 'pagerduty',
                };
            }
        }
    }

    // Fall back to mock data
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

    return { timeline, metricPoints, dataSource: 'mock' };
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

/**
 * Get current integration status
 */
export async function getIntegrations() {
    return getIntegrationStatus();
}
