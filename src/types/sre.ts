/**
 * Core types for the SRE Command Center
 */

export interface Alert {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
    service: string;
    timestamp: Date;
    status: 'firing' | 'acknowledged' | 'resolved';
    source: string;
    labels: Record<string, string>;
    annotations?: Record<string, string>;
}

export interface Service {
    id: string;
    name: string;
    status: 'healthy' | 'degraded' | 'critical' | 'unknown';
    uptime: number;
    latency: number;
    errorRate: number;
    requestsPerSecond: number;
    lastDeployment?: Date;
    version?: string;
}

export interface Incident {
    id: string;
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    startTime: Date;
    endTime?: Date;
    affectedServices: string[];
    timeline: IncidentTimelineEvent[];
    rootCause?: string;
    assignee?: string;
}

export interface IncidentTimelineEvent {
    id: string;
    timestamp: Date;
    type: 'alert' | 'action' | 'note' | 'resolution';
    description: string;
    author?: string;
}

export interface Commit {
    sha: string;
    message: string;
    author: string;
    timestamp: Date;
    files: string[];
    additions: number;
    deletions: number;
}

export interface HealthMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    threshold?: {
        warning: number;
        critical: number;
    };
}

export interface RemediationAction {
    id: string;
    name: string;
    description: string;
    type: 'automatic' | 'manual';
    risk: 'low' | 'medium' | 'high';
    estimatedImpact: string;
    steps: string[];
    enabled: boolean;
}

export interface SystemStatus {
    overall: 'operational' | 'degraded' | 'outage';
    services: Service[];
    activeAlerts: number;
    activeIncidents: number;
    lastUpdated: Date;
}
