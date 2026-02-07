/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * SRE Command Center - AI-powered incident response platform
 */

import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

// Import SRE components
import { incidentTimelineComponent } from "@/components/sre/incident-timeline";
import { anomalyHeatmapComponent } from "@/components/sre/anomaly-heatmap";
import { serviceStatusGridComponent } from "@/components/sre/service-status-grid";
import { rootCauseAnalysisComponent } from "@/components/sre/root-cause-analysis";
import { alertSummaryComponent } from "@/components/sre/alert-summary";
import { Graph, graphSchema } from "@/components/tambo/graph";

// Import SRE tools
import {
  getSystemOverview,
  getServiceStatus,
  getActiveAlerts,
  getCurrentIncident,
  analyzeRecentCommits,
  getHealthMetrics,
  getRemediationOptions,
  executeRemediation,
  getSlackContext,
  getRootCauseAnalysis,
  getIncidentTimelineData,
  getAnomalyHeatmapData,
  getIntegrations,
} from "@/services/sre-tools";

// Import local browser tools
import {
  flushLocalCache,
  restartSession,
  copyToClipboard,
  getBrowserPerformance,
  sendBrowserNotification,
  exportIncidentData,
  playAlertSound,
  getTimezoneInfo,
} from "@/services/local-tools";

/**
 * SRE Tools - Backend data fetching and analysis
 */
export const tools: TamboTool[] = [
  {
    name: "getSystemOverview",
    description:
      "Get a high-level overview of the system status including active alerts, incidents, and service health summary. Use this first to understand the current state.",
    tool: getSystemOverview,
    inputSchema: z.object({}),
    outputSchema: z.object({
      overallStatus: z.enum(["operational", "degraded", "outage"]),
      totalServices: z.number(),
      healthyServices: z.number(),
      degradedServices: z.number(),
      criticalServices: z.number(),
      activeAlerts: z.number(),
      activeIncidents: z.number(),
      lastUpdated: z.string(),
    }),
  },
  {
    name: "getServiceStatus",
    description:
      "Get detailed status information for services. Can filter by service name to get specific service details.",
    tool: getServiceStatus,
    inputSchema: z.object({
      serviceName: z.string().optional().describe("Optional service name to filter by"),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        status: z.enum(["healthy", "degraded", "critical", "unknown"]),
        uptime: z.number(),
        latency: z.number(),
        errorRate: z.number(),
        requestsPerSecond: z.number(),
        version: z.string().optional(),
      })
    ),
  },
  {
    name: "getActiveAlerts",
    description:
      "Get a list of active alerts. Can filter by severity (critical, warning, info) or service name.",
    tool: getActiveAlerts,
    inputSchema: z.object({
      severity: z.enum(["critical", "warning", "info"]).optional(),
      service: z.string().optional(),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        severity: z.enum(["critical", "warning", "info"]),
        title: z.string(),
        service: z.string(),
        timestamp: z.string(),
        status: z.enum(["firing", "acknowledged", "resolved"]),
      })
    ),
  },
  {
    name: "getCurrentIncident",
    description:
      "Get details about the current active incident including timeline, affected services, and status.",
    tool: getCurrentIncident,
    inputSchema: z.object({}),
    outputSchema: z.object({
      id: z.string(),
      title: z.string(),
      severity: z.enum(["critical", "high", "medium", "low"]),
      status: z.enum(["investigating", "identified", "monitoring", "resolved"]),
      startTime: z.string(),
      duration: z.number().describe("Duration in minutes"),
      affectedServices: z.array(z.string()),
      timeline: z.array(
        z.object({
          timestamp: z.string(),
          type: z.string(),
          description: z.string(),
          author: z.string().optional(),
        })
      ),
    }),
  },
  {
    name: "analyzeRecentCommits",
    description:
      "Analyze recent code commits to find potential breaking changes or suspicious deployments. Simulates GitHub MCP integration.",
    tool: analyzeRecentCommits,
    inputSchema: z.object({
      service: z.string().optional(),
      hoursBack: z.number().optional().default(24),
    }),
    outputSchema: z.object({
      commits: z.array(
        z.object({
          sha: z.string(),
          message: z.string(),
          author: z.string(),
          timestamp: z.string(),
          isBreakingChange: z.boolean(),
          affectsConfiguration: z.boolean(),
          isLargeChange: z.boolean(),
        })
      ),
      suspiciousCommits: z.array(z.any()),
      summary: z.string(),
    }),
  },
  {
    name: "getHealthMetrics",
    description:
      "Get system health metrics like CPU, memory, disk I/O, and network throughput with threshold status.",
    tool: getHealthMetrics,
    inputSchema: z.object({
      metricName: z.string().optional(),
    }),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        value: z.number(),
        unit: z.string(),
        trend: z.enum(["up", "down", "stable"]),
        status: z.enum(["ok", "warning", "critical"]),
      })
    ),
  },
  {
    name: "getRemediationOptions",
    description:
      "Get available remediation actions for incident response. Can filter by risk level.",
    tool: getRemediationOptions,
    inputSchema: z.object({
      riskLevel: z.enum(["low", "medium", "high"]).optional(),
    }),
    outputSchema: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        type: z.enum(["automatic", "manual"]),
        risk: z.enum(["low", "medium", "high"]),
        estimatedImpact: z.string(),
        steps: z.array(z.string()),
        enabled: z.boolean(),
      })
    ),
  },
  {
    name: "executeRemediation",
    description:
      "Execute a specific remediation action by ID. Returns success status and execution details.",
    tool: executeRemediation,
    inputSchema: z.object({
      actionId: z.string().describe("The ID of the remediation action to execute"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      action: z.string().optional(),
      message: z.string().optional(),
      error: z.string().optional(),
      steps: z.array(z.string()).optional(),
      estimatedCompletion: z.string().optional(),
    }),
  },
  {
    name: "getSlackContext",
    description:
      "Get relevant Slack conversations about the incident. Simulates Slack MCP integration for team context.",
    tool: getSlackContext,
    inputSchema: z.object({
      channel: z.string().optional().default("#incidents"),
    }),
    outputSchema: z.object({
      messages: z.array(
        z.object({
          channel: z.string(),
          author: z.string(),
          timestamp: z.string(),
          message: z.string(),
        })
      ),
      summary: z.string(),
    }),
  },
  {
    name: "getRootCauseAnalysis",
    description:
      "Get AI-powered root cause analysis with confidence score, evidence, and recommended action.",
    tool: getRootCauseAnalysis,
    inputSchema: z.object({}),
    outputSchema: z.object({
      suspectedCause: z.string(),
      confidence: z.number(),
      evidence: z.array(z.string()),
      recommendedAction: z.string(),
    }),
  },
  {
    name: "getIncidentTimelineData",
    description:
      "Get timeline and metric data for incident visualization. Use this to populate the IncidentTimeline component.",
    tool: getIncidentTimelineData,
    inputSchema: z.object({}),
    outputSchema: z.object({
      timeline: z.array(
        z.object({
          time: z.string(),
          event: z.string(),
          type: z.string(),
          author: z.string(),
        })
      ),
      metricPoints: z.array(
        z.object({
          time: z.string(),
          errorRate: z.number(),
          memory: z.number(),
        })
      ),
    }),
  },
  {
    name: "getAnomalyHeatmapData",
    description:
      "Get anomaly score data for all services over time. Use this to populate the AnomalyHeatmap component.",
    tool: getAnomalyHeatmapData,
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        service: z.string(),
        anomalies: z.array(
          z.object({
            time: z.string(),
            score: z.number(),
          })
        ),
      })
    ),
  },
  // Local browser tools
  {
    name: "flushLocalCache",
    description:
      "Flush the browser's local cache, localStorage, and sessionStorage. Use for troubleshooting caching issues.",
    tool: flushLocalCache,
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  {
    name: "restartSession",
    description:
      "Restart the current browser session. Clears session data and reloads the page.",
    tool: restartSession,
    inputSchema: z.object({}),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  {
    name: "copyToClipboard",
    description: "Copy text to the system clipboard for sharing incident details.",
    tool: copyToClipboard,
    inputSchema: z.object({
      text: z.string().describe("The text to copy to clipboard"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  {
    name: "getBrowserPerformance",
    description:
      "Get browser performance metrics including memory usage, page load time, and network info.",
    tool: getBrowserPerformance,
    inputSchema: z.object({}),
    outputSchema: z.object({
      memory: z
        .object({
          usedJSHeapSize: z.number(),
          totalJSHeapSize: z.number(),
        })
        .optional(),
      timing: z.object({
        pageLoadTime: z.number(),
        domContentLoaded: z.number(),
      }),
      connection: z
        .object({
          effectiveType: z.string(),
          downlink: z.number(),
        })
        .optional(),
    }),
  },
  {
    name: "sendBrowserNotification",
    description:
      "Send a browser notification for important alerts. Requires notification permission.",
    tool: sendBrowserNotification,
    inputSchema: z.object({
      title: z.string(),
      body: z.string(),
      urgent: z.boolean().optional().default(false),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  {
    name: "exportIncidentData",
    description: "Export incident data as a downloadable JSON file. Provide the data as a stringified JSON.",
    tool: exportIncidentData,
    inputSchema: z.object({
      jsonData: z.string().describe("The stringified JSON data to export"),
      filename: z.string().optional(),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  {
    name: "playAlertSound",
    description:
      "Play an alert sound to draw attention to critical issues.",
    tool: playAlertSound,
    inputSchema: z.object({
      type: z.enum(["critical", "warning", "info"]).optional().default("info"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
  },
  {
    name: "getTimezoneInfo",
    description:
      "Get the user's timezone information for accurate incident reporting.",
    tool: getTimezoneInfo,
    inputSchema: z.object({}),
    outputSchema: z.object({
      timezone: z.string(),
      offset: z.number(),
      offsetString: z.string(),
      currentTime: z.string(),
    }),
  },
  {
    name: "getIntegrations",
    description:
      "Get the status of all configured integrations (GitHub, Prometheus, Slack, Kubernetes). Shows which data sources are connected.",
    tool: getIntegrations,
    inputSchema: z.object({}),
    outputSchema: z.array(
      z.object({
        name: z.string(),
        enabled: z.boolean(),
        status: z.enum(["connected", "disconnected", "error"]),
        details: z.string().optional(),
      })
    ),
  },
];

/**
 * SRE Components - Generative UI for incident response
 */
export const components: TamboComponent[] = [
  incidentTimelineComponent,
  anomalyHeatmapComponent,
  serviceStatusGridComponent,
  rootCauseAnalysisComponent,
  alertSummaryComponent,
  {
    name: "Graph",
    description:
      "A component that renders various types of charts (bar, line, pie) using Recharts. Supports customizable data visualization with labels, datasets, and styling options. Use for metric trends and comparisons.",
    component: Graph,
    propsSchema: graphSchema,
  },
];
