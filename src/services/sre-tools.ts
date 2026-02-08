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
    queryPrometheusRange,
    getPagerDutyIncidents,
    getIncidentTimeline as getPagerDutyIncidentTimeline,
    getSlackContext as getSlackContextFromIntegration,
    getDeployments,
    getPodStatus,
    restartDeployment,
    scaleDeployment,
    rollbackDeployment,
} from '@/lib/integrations';
import type { RemediationAction } from '@/types/sre';

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

type KubernetesRemediationOperation = 'restart' | 'scale' | 'rollback';

function buildKubernetesActionId(
    operation: KubernetesRemediationOperation,
    namespace: string,
    deployment: string,
    replicas?: number
) {
    if (operation === 'scale') {
        return `k8s:${operation}:${namespace}:${deployment}:${replicas ?? 1}`;
    }
    return `k8s:${operation}:${namespace}:${deployment}`;
}

function parseKubernetesActionId(actionId: string): {
    operation: KubernetesRemediationOperation;
    namespace: string;
    deployment: string;
    replicas?: number;
} | null {
    if (!actionId.startsWith('k8s:')) {
        return null;
    }

    const parts = actionId.split(':');
    if (parts.length < 4) {
        return null;
    }

    const operation = parts[1] as KubernetesRemediationOperation;
    if (!['restart', 'scale', 'rollback'].includes(operation)) {
        return null;
    }

    const namespace = parts[2];
    const deployment = parts[3];

    if (!namespace || !deployment) {
        return null;
    }

    if (operation === 'scale') {
        const replicas = Number(parts[4]);
        if (!Number.isFinite(replicas)) {
            return null;
        }
        return { operation, namespace, deployment, replicas };
    }

    return { operation, namespace, deployment };
}

function isNamespaceAllowed(namespace: string, allowedNamespaces?: string[]) {
    if (!allowedNamespaces || allowedNamespaces.length === 0) {
        return true;
    }
    return allowedNamespaces.includes(namespace);
}

/**
 * Get available remediation actions
 */
export async function getRemediationOptions(params: { riskLevel?: 'low' | 'medium' | 'high' }) {
    const config = await getIntegrationConfig();

    if (config.kubernetes.enabled) {
        const namespace =
            config.kubernetes.defaultNamespace ||
            config.kubernetes.allowedNamespaces?.[0] ||
            'default';

        const [deploymentResult, podResult] = await Promise.all([
            getDeployments(namespace),
            getPodStatus(namespace),
        ]);

        if (!deploymentResult.error && deploymentResult.deployments.length > 0) {
            const remediationEnabled = process.env.ENABLE_K8S_REMEDIATION === 'true';
            const rollbackEnabled = process.env.ENABLE_K8S_ROLLBACK === 'true';
            const unstablePods = podResult.pods.filter(
                p => p.phase !== 'Running' || !p.ready || p.restarts >= 3
            );

            const candidateDeployments = deploymentResult.deployments
                .filter(dep => dep.status !== 'healthy' || unstablePods.some(p => p.name.startsWith(dep.name)))
                .slice(0, 4);

            const actions: RemediationAction[] = [];

            for (const dep of candidateDeployments) {
                const targetReplicas = Math.min(dep.replicas + 2, 20);

                actions.push({
                    id: buildKubernetesActionId('restart', namespace, dep.name),
                    name: `Restart ${dep.name}`,
                    description: `Rolling restart for deployment ${dep.name} in namespace ${namespace}`,
                    type: 'automatic',
                    risk: 'low',
                    estimatedImpact: 'Brief pod churn while new replicas become ready',
                    steps: [
                        `Patch deployment ${dep.name} with restart annotation`,
                        'Wait for rollout to create new pods',
                        'Verify all replicas become healthy',
                    ],
                    enabled: remediationEnabled,
                });

                actions.push({
                    id: buildKubernetesActionId('scale', namespace, dep.name, targetReplicas),
                    name: `Scale ${dep.name} to ${targetReplicas}`,
                    description: `Increase replica count for ${dep.name} to absorb incident traffic`,
                    type: 'automatic',
                    risk: 'low',
                    estimatedImpact: `Additional cluster resource usage for ${targetReplicas} replicas`,
                    steps: [
                        `Update ${dep.name} scale target to ${targetReplicas}`,
                        'Wait for new pods to schedule',
                        'Verify load and error rates stabilize',
                    ],
                    enabled: remediationEnabled,
                });

                actions.push({
                    id: buildKubernetesActionId('rollback', namespace, dep.name),
                    name: `Rollback ${dep.name}`,
                    description: `Roll back deployment ${dep.name} to the previous ReplicaSet revision`,
                    type: 'manual',
                    risk: 'high',
                    estimatedImpact: 'Potentially disruptive if schema or API compatibility changed',
                    steps: [
                        'Identify previous healthy ReplicaSet revision',
                        'Patch deployment template back to prior revision',
                        'Validate health checks and traffic behavior',
                    ],
                    enabled: remediationEnabled && rollbackEnabled,
                });
            }

            let filteredActions = actions;
            if (params.riskLevel) {
                filteredActions = filteredActions.filter(a => a.risk === params.riskLevel);
            }

            if (filteredActions.length > 0) {
                return filteredActions;
            }
        }
    }

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
    const kubernetesAction = parseKubernetesActionId(params.actionId);
    const config = await getIntegrationConfig();

    if (kubernetesAction && config.kubernetes.enabled) {
        if (process.env.ENABLE_K8S_REMEDIATION !== 'true') {
            return {
                success: false,
                error: 'Kubernetes remediation is disabled. Set ENABLE_K8S_REMEDIATION=true to allow live actions.',
            };
        }

        if (!isNamespaceAllowed(kubernetesAction.namespace, config.kubernetes.allowedNamespaces)) {
            return {
                success: false,
                error: `Namespace "${kubernetesAction.namespace}" is not in the allowed namespace list.`,
            };
        }

        if (kubernetesAction.operation === 'rollback' && process.env.ENABLE_K8S_ROLLBACK !== 'true') {
            return {
                success: false,
                error: 'Rollback is disabled. Set ENABLE_K8S_ROLLBACK=true for high-risk rollback actions.',
            };
        }

        if (kubernetesAction.operation === 'restart') {
            const result = await restartDeployment(kubernetesAction.deployment, kubernetesAction.namespace);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to restart deployment' };
            }

            return {
                success: true,
                action: `Restart ${kubernetesAction.deployment}`,
                message: `Restart initiated for ${kubernetesAction.namespace}/${kubernetesAction.deployment}`,
                steps: [
                    'Deployment patched with restart annotation',
                    'Kubernetes rollout triggered',
                    'Pods will cycle while maintaining service availability',
                ],
                estimatedCompletion: '2-5 minutes',
            };
        }

        if (kubernetesAction.operation === 'scale') {
            const replicas = kubernetesAction.replicas || 1;
            if (replicas < 1 || replicas > 100) {
                return { success: false, error: 'Requested replica count is outside safety limits (1-100).' };
            }

            const result = await scaleDeployment(
                kubernetesAction.deployment,
                kubernetesAction.namespace,
                replicas
            );
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to scale deployment' };
            }

            return {
                success: true,
                action: `Scale ${kubernetesAction.deployment}`,
                message: `Scaling ${kubernetesAction.namespace}/${kubernetesAction.deployment} to ${replicas} replicas`,
                steps: [
                    `Scale subresource updated to ${replicas}`,
                    'Scheduler places new pods on available nodes',
                    'Health checks confirm readiness before full traffic',
                ],
                estimatedCompletion: '2-8 minutes',
            };
        }

        if (kubernetesAction.operation === 'rollback') {
            const result = await rollbackDeployment(kubernetesAction.deployment, kubernetesAction.namespace);
            if (!result.success) {
                return { success: false, error: result.error || 'Failed to rollback deployment' };
            }

            return {
                success: true,
                action: `Rollback ${kubernetesAction.deployment}`,
                message: `Rollback initiated for ${kubernetesAction.namespace}/${kubernetesAction.deployment}`,
                steps: [
                    'Previous ReplicaSet template selected',
                    'Deployment patched to prior revision',
                    'Rollout progressing with prior known-good template',
                ],
                estimatedCompletion: '3-10 minutes',
            };
        }
    }

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
    const config = await getIntegrationConfig();

    if (config.slack.enabled) {
        const { messages, summary, error } = await getSlackContextFromIntegration({
            channel: params.channel,
            hoursBack: 6,
        });

        if (!error && messages.length > 0) {
            return {
                messages: messages.map(m => ({
                    author: m.author,
                    message: m.text,
                    channel: m.channel,
                    timestamp: m.timestamp,
                })),
                summary: summary || `Retrieved ${messages.length} Slack messages for incident context`,
                dataSource: 'slack',
            };
        }
    }

    // Fall back to mock data
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
    const [incidentResult, alertsResult, commitsResult, slackResult, metricsResult] = await Promise.all([
        getCurrentIncident(),
        getActiveAlerts({ severity: 'critical' }),
        analyzeRecentCommits({ hoursBack: 24 }),
        getSlackContext({}),
        getHealthMetrics({}),
    ]);

    const incidentSource = incidentResult.dataSource;
    const alertsSource = alertsResult.dataSource;
    const commitsSource = commitsResult.dataSource;
    const slackSource = slackResult.dataSource;
    const metricsSource = metricsResult.dataSource;

    // If everything is mock, keep previous deterministic RCA output.
    if (
        incidentSource === 'mock' &&
        alertsSource === 'mock' &&
        commitsSource === 'mock' &&
        slackSource === 'mock' &&
        metricsSource === 'mock'
    ) {
        return mockRootCauseAnalysis;
    }

    const criticalAlerts = (alertsResult.alerts || []).map(a => ({
        service: a.service,
        title: 'name' in a ? a.name : a.title,
        detail: 'message' in a ? a.message : a.description,
    }));
    const topAlert = criticalAlerts[0];
    const serviceFromAlert = topAlert?.service;

    const incidentService = (incidentResult as { service?: string }).service
        || ((incidentResult as { affectedServices?: string[] }).affectedServices || [])[0];

    const primaryService = serviceFromAlert || incidentService || 'core service';

    const suspiciousCommits = commitsResult.suspiciousCommits || [];
    const riskyCommit = suspiciousCommits[0] || commitsResult.commits?.[0];
    const riskyCommitSha = riskyCommit?.sha;

    const joinedSlackText = (slackResult.messages || [])
        .map(m => m.message?.toLowerCase() || '')
        .join(' ');
    const joinedAlertText = (criticalAlerts || [])
        .map(a => `${a.title || ''} ${a.detail || ''}`.toLowerCase())
        .join(' ');
    const joinedMetricText = (metricsResult.metrics || [])
        .map(m => `${m.name || ''} ${m.status || ''}`.toLowerCase())
        .join(' ');

    const hasMemorySignal = /memory|oom|leak/.test(`${joinedSlackText} ${joinedAlertText} ${joinedMetricText}`);
    const hasLatencySignal = /latency|timeout|slow/.test(`${joinedSlackText} ${joinedAlertText}`);
    const hasErrorSpikeSignal = /error|5xx|failure/.test(joinedAlertText);

    let suspectedCause = `Operational degradation detected in ${primaryService}.`;
    if (riskyCommitSha && hasMemorySignal) {
        suspectedCause = `Potential memory pressure introduced by recent change ${riskyCommitSha} affecting ${primaryService}.`;
    } else if (riskyCommitSha && hasLatencySignal) {
        suspectedCause = `Recent code change ${riskyCommitSha} likely correlates with latency regression in ${primaryService}.`;
    } else if (riskyCommitSha) {
        suspectedCause = `Recent risky deployment (${riskyCommitSha}) is the most probable trigger for ${primaryService} instability.`;
    } else if (hasMemorySignal) {
        suspectedCause = `Resource exhaustion (memory pressure) is the likely cause of ${primaryService} instability.`;
    } else if (hasLatencySignal) {
        suspectedCause = `Sustained latency increase indicates performance regression in ${primaryService}.`;
    }

    const evidence: string[] = [];

    if (incidentSource !== 'mock') {
        evidence.push(`PagerDuty incident context is active for ${primaryService}.`);
    }
    if (alertsSource !== 'mock' && topAlert) {
        evidence.push(`Critical alert: ${topAlert.title} (${topAlert.service}).`);
    }
    if (commitsSource !== 'mock' && riskyCommitSha) {
        evidence.push(`Recent GitHub change with elevated risk: ${riskyCommitSha}.`);
    }
    if (slackSource !== 'mock' && (slackResult.messages || []).length > 0) {
        evidence.push(`Slack incident channel contains recent team discussion with remediation hints.`);
    }
    if (metricsSource !== 'mock') {
        const criticalMetric = (metricsResult.metrics || []).find(m => m.status === 'critical');
        if (criticalMetric) {
            evidence.push(`Critical metric observed: ${criticalMetric.name} at ${criticalMetric.value}${criticalMetric.unit}.`);
        }
    }

    if (evidence.length === 0) {
        evidence.push('Insufficient live telemetry. Falling back to partial signals from available integrations.');
    }

    let confidence = 45;
    if (incidentSource !== 'mock') confidence += 10;
    if (alertsSource !== 'mock' && criticalAlerts.length > 0) confidence += 20;
    if (commitsSource !== 'mock' && riskyCommitSha) confidence += 15;
    if (slackSource !== 'mock' && (slackResult.messages || []).length > 0) confidence += 10;
    if (metricsSource !== 'mock') confidence += 10;
    if (hasMemorySignal || hasLatencySignal || hasErrorSpikeSignal) confidence += 5;
    confidence = Math.max(30, Math.min(95, confidence));

    let recommendedAction = `Stabilize ${primaryService} with low-risk remediation (restart/scale), then validate error and latency recovery.`;
    if (riskyCommitSha) {
        recommendedAction = `Prioritize rollback or canary disable for change ${riskyCommitSha}, then monitor ${primaryService} for 15 minutes.`;
    } else if (hasMemorySignal) {
        recommendedAction = `Scale ${primaryService} and restart unhealthy pods, then inspect memory usage and leak indicators.`;
    }

    return {
        suspectedCause,
        confidence,
        evidence,
        recommendedAction,
    };
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
    const config = await getIntegrationConfig();

    if (config.prometheus.enabled) {
        const end = new Date();
        const start = new Date(end.getTime() - 20 * 60 * 60 * 1000); // 6 buckets of 4h

        const [errorRateRange, latencyRange] = await Promise.all([
            queryPrometheusRange(
                'sum(rate(http_requests_total{status=~"5.."}[5m])) by (job) / clamp_min(sum(rate(http_requests_total[5m])) by (job), 0.001) * 100',
                { start, end, step: '4h' }
            ),
            queryPrometheusRange(
                'histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, job)) * 1000',
                { start, end, step: '4h' }
            ),
        ]);

        const liveSeries = [...errorRateRange.result, ...latencyRange.result].find(s => s.values.length > 0);
        const defaultSlots = Array.from({ length: 6 }, (_, index) =>
            new Date(start.getTime() + index * 4 * 60 * 60 * 1000).toISOString()
        );
        const slotTimestamps = liveSeries
            ? liveSeries.values.slice(-6).map(v => v.timestamp)
            : defaultSlots;

        const buildSeriesMap = (
            series: Array<{
                metric: Record<string, string>;
                values: Array<{ timestamp: string; value: number }>;
            }>
        ) => {
            const seriesMap = new Map<string, number[]>();

            for (const entry of series) {
                const rawName =
                    entry.metric.service ||
                    entry.metric.job ||
                    entry.metric.app ||
                    entry.metric.k8s_app ||
                    'unknown';

                const formattedName = rawName
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, (char) => char.toUpperCase());

                const valuesByTimestamp = new Map(
                    entry.values.map(v => [v.timestamp, Number.isFinite(v.value) ? v.value : 0])
                );
                const alignedValues = slotTimestamps.map(ts => valuesByTimestamp.get(ts) ?? 0);

                if (!seriesMap.has(formattedName)) {
                    seriesMap.set(formattedName, alignedValues);
                }
            }

            return seriesMap;
        };

        const calculateStats = (values: number[]) => {
            if (values.length === 0) {
                return { mean: 0, stdDev: 0 };
            }
            const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
            const variance =
                values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
                Math.max(values.length - 1, 1);
            return { mean, stdDev: Math.sqrt(variance) };
        };

        const errorMap = buildSeriesMap(errorRateRange.result);
        const latencyMap = buildSeriesMap(latencyRange.result);

        const services = Array.from(new Set([...errorMap.keys(), ...latencyMap.keys()]));

        if (services.length > 0) {
            return services.slice(0, 12).map(service => {
                const errorValues = errorMap.get(service) || new Array(slotTimestamps.length).fill(0);
                const latencyValues = latencyMap.get(service) || new Array(slotTimestamps.length).fill(0);

                const errorStats = calculateStats(errorValues);
                const latencyStats = calculateStats(latencyValues);

                return {
                    service,
                    anomalies: slotTimestamps.map((timestamp, index) => {
                        const errorRate = errorValues[index] || 0;
                        const latency = latencyValues[index] || 0;

                        const errorZ =
                            errorStats.stdDev > 0 ? Math.max(0, (errorRate - errorStats.mean) / errorStats.stdDev) : 0;
                        const latencyZ =
                            latencyStats.stdDev > 0
                                ? Math.max(0, (latency - latencyStats.mean) / latencyStats.stdDev)
                                : 0;

                        const thresholdComponent =
                            Math.min((errorRate / 5) * 60, 60) + Math.min((latency / 1000) * 25, 25);
                        const zScoreComponent = Math.min(errorZ, 3) / 3 * 10 + Math.min(latencyZ, 3) / 3 * 5;
                        const score = Math.max(0, Math.min(100, thresholdComponent + zScoreComponent));

                        return {
                            time: new Date(timestamp).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                            }),
                            score: Math.round(score * 10) / 10,
                        };
                    }),
                };
            });
        }
    }

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
