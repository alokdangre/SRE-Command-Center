/**
 * Prometheus Integration
 * Fetches real metrics from Prometheus API
 */

import { getIntegrationConfig } from "./config";

interface PrometheusMetric {
    name: string;
    value: number;
    unit: string;
    labels: Record<string, string>;
    timestamp: string;
}

interface PrometheusAlert {
    alertname: string;
    state: "firing" | "pending" | "inactive";
    severity: "critical" | "warning" | "info";
    labels: Record<string, string>;
    annotations: Record<string, string>;
    activeAt: string;
}

interface ServiceHealth {
    name: string;
    status: "healthy" | "degraded" | "critical";
    uptime: number;
    latencyP50: number;
    latencyP99: number;
    errorRate: number;
    requestRate: number;
}

/**
 * Execute a PromQL query
 */
export async function queryPrometheus(
    query: string
): Promise<{ result: PrometheusMetric[]; error?: string }> {
    const config = await getIntegrationConfig();

    if (!config.prometheus.enabled || !config.prometheus.url) {
        return {
            result: [],
            error: "Prometheus integration not configured. Set PROMETHEUS_URL in .env.local",
        };
    }

    try {
        const url = `${config.prometheus.url}/api/v1/query?query=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                Accept: "application/json",
            },
            next: { revalidate: 15 }, // Cache for 15 seconds
        });

        if (!response.ok) {
            throw new Error(`Prometheus API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error(data.error || "Query failed");
        }

        const metrics: PrometheusMetric[] = data.data.result.map((r: {
            metric: Record<string, string>;
            value: [number, string];
        }) => ({
            name: r.metric.__name__ || query,
            value: parseFloat(r.value[1]),
            unit: "",
            labels: r.metric,
            timestamp: new Date(r.value[0] * 1000).toISOString(),
        }));

        return { result: metrics };
    } catch (error) {
        return {
            result: [],
            error: error instanceof Error ? error.message : "Failed to query Prometheus",
        };
    }
}

/**
 * Query range data for graphs
 */
export async function queryPrometheusRange(
    query: string,
    options: {
        start?: Date;
        end?: Date;
        step?: string;
    } = {}
): Promise<{
    result: Array<{
        metric: Record<string, string>;
        values: Array<{ timestamp: string; value: number }>;
    }>;
    error?: string;
}> {
    const config = await getIntegrationConfig();

    if (!config.prometheus.enabled || !config.prometheus.url) {
        return {
            result: [],
            error: "Prometheus integration not configured",
        };
    }

    const end = options.end || new Date();
    const start = options.start || new Date(end.getTime() - 60 * 60 * 1000); // 1 hour default
    const step = options.step || "1m";

    try {
        const url = `${config.prometheus.url}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start.toISOString()}&end=${end.toISOString()}&step=${step}`;

        const response = await fetch(url, {
            headers: { Accept: "application/json" },
            next: { revalidate: 30 },
        });

        if (!response.ok) {
            throw new Error(`Prometheus API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== "success") {
            throw new Error(data.error || "Query failed");
        }

        const result = data.data.result.map((r: {
            metric: Record<string, string>;
            values: Array<[number, string]>;
        }) => ({
            metric: r.metric,
            values: r.values.map(([ts, val]) => ({
                timestamp: new Date(ts * 1000).toISOString(),
                value: parseFloat(val),
            })),
        }));

        return { result };
    } catch (error) {
        return {
            result: [],
            error: error instanceof Error ? error.message : "Failed to query Prometheus",
        };
    }
}

/**
 * Fetch active alerts from Alertmanager
 */
export async function fetchPrometheusAlerts(): Promise<{
    alerts: PrometheusAlert[];
    error?: string;
}> {
    const config = await getIntegrationConfig();

    if (!config.prometheus.enabled || !config.prometheus.url) {
        return {
            alerts: [],
            error: "Prometheus integration not configured",
        };
    }

    try {
        // Try Alertmanager first (common setup)
        const alertmanagerUrl = config.prometheus.url.replace(":9090", ":9093");
        const response = await fetch(`${alertmanagerUrl}/api/v2/alerts`, {
            headers: { Accept: "application/json" },
            next: { revalidate: 15 },
        });

        if (!response.ok) {
            // Fallback to Prometheus alerts endpoint
            const promResponse = await fetch(`${config.prometheus.url}/api/v1/alerts`, {
                headers: { Accept: "application/json" },
                next: { revalidate: 15 },
            });

            if (!promResponse.ok) {
                throw new Error("Failed to fetch alerts");
            }

            const promData = await promResponse.json();

            return {
                alerts: promData.data.alerts.map((a: {
                    labels: Record<string, string>;
                    annotations: Record<string, string>;
                    state: string;
                    activeAt: string;
                }) => ({
                    alertname: a.labels.alertname,
                    state: a.state as PrometheusAlert["state"],
                    severity: (a.labels.severity || "warning") as PrometheusAlert["severity"],
                    labels: a.labels,
                    annotations: a.annotations,
                    activeAt: a.activeAt,
                })),
            };
        }

        const data = await response.json();

        const alerts: PrometheusAlert[] = data.map((a: {
            labels: Record<string, string>;
            annotations: Record<string, string>;
            status: { state: string };
            startsAt: string;
        }) => ({
            alertname: a.labels.alertname,
            state: a.status.state as PrometheusAlert["state"],
            severity: (a.labels.severity || "warning") as PrometheusAlert["severity"],
            labels: a.labels,
            annotations: a.annotations,
            activeAt: a.startsAt,
        }));

        return { alerts };
    } catch (error) {
        return {
            alerts: [],
            error: error instanceof Error ? error.message : "Failed to fetch alerts",
        };
    }
}

/**
 * Get service health metrics
 */
export async function getServiceHealth(
    serviceName?: string
): Promise<{ services: ServiceHealth[]; error?: string }> {
    const config = await getIntegrationConfig();

    if (!config.prometheus.enabled) {
        return {
            services: [],
            error: "Prometheus integration not configured",
        };
    }

    try {
        // Common Prometheus queries for service health
        const queries = {
            uptime: `up{job=~".*${serviceName || ""}.*"}`,
            latencyP50: `histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=~".*${serviceName || ""}.*"}[5m]))`,
            latencyP99: `histogram_quantile(0.99, rate(http_request_duration_seconds_bucket{job=~".*${serviceName || ""}.*"}[5m]))`,
            errorRate: `sum(rate(http_requests_total{job=~".*${serviceName || ""}.*",status=~"5.."}[5m])) / sum(rate(http_requests_total{job=~".*${serviceName || ""}.*"}[5m])) * 100`,
            requestRate: `sum(rate(http_requests_total{job=~".*${serviceName || ""}.*"}[5m]))`,
        };

        const [uptimeResult, latencyP50Result, latencyP99Result, errorRateResult, requestRateResult] = await Promise.all([
            queryPrometheus(queries.uptime),
            queryPrometheus(queries.latencyP50),
            queryPrometheus(queries.latencyP99),
            queryPrometheus(queries.errorRate),
            queryPrometheus(queries.requestRate),
        ]);

        // Build service health from results
        const serviceMap = new Map<string, Partial<ServiceHealth>>();

        // Process uptime
        uptimeResult.result.forEach((m) => {
            const name = m.labels.job || m.labels.service || "unknown";
            serviceMap.set(name, {
                ...serviceMap.get(name),
                name,
                uptime: m.value,
            });
        });

        // Process other metrics
        latencyP50Result.result.forEach((m) => {
            const name = m.labels.job || m.labels.service;
            if (name && serviceMap.has(name)) {
                serviceMap.set(name, { ...serviceMap.get(name), latencyP50: m.value * 1000 }); // Convert to ms
            }
        });

        latencyP99Result.result.forEach((m) => {
            const name = m.labels.job || m.labels.service;
            if (name && serviceMap.has(name)) {
                serviceMap.set(name, { ...serviceMap.get(name), latencyP99: m.value * 1000 });
            }
        });

        errorRateResult.result.forEach((m) => {
            const name = m.labels.job || m.labels.service;
            if (name && serviceMap.has(name)) {
                serviceMap.set(name, { ...serviceMap.get(name), errorRate: m.value });
            }
        });

        requestRateResult.result.forEach((m) => {
            const name = m.labels.job || m.labels.service;
            if (name && serviceMap.has(name)) {
                serviceMap.set(name, { ...serviceMap.get(name), requestRate: m.value });
            }
        });

        // Calculate status based on metrics
        const services: ServiceHealth[] = Array.from(serviceMap.values()).map((s) => {
            let status: ServiceHealth["status"] = "healthy";
            if (s.uptime === 0) status = "critical";
            else if ((s.errorRate || 0) > 5) status = "critical";
            else if ((s.errorRate || 0) > 1 || (s.latencyP99 || 0) > 1000) status = "degraded";

            return {
                name: s.name || "unknown",
                status,
                uptime: s.uptime || 0,
                latencyP50: s.latencyP50 || 0,
                latencyP99: s.latencyP99 || 0,
                errorRate: s.errorRate || 0,
                requestRate: s.requestRate || 0,
            };
        });

        return { services };
    } catch (error) {
        return {
            services: [],
            error: error instanceof Error ? error.message : "Failed to fetch service health",
        };
    }
}

/**
 * Get health metrics summary
 */
export async function getHealthMetrics(options: {
    metricName?: string;
}): Promise<{
    metrics: Array<{
        name: string;
        value: number;
        unit: string;
        status: "ok" | "warning" | "critical";
    }>;
    error?: string;
}> {
    const config = await getIntegrationConfig();

    if (!config.prometheus.enabled) {
        return {
            metrics: [],
            error: "Prometheus integration not configured",
        };
    }

    // Standard SRE metrics
    const metricQueries = [
        { name: "CPU Usage", query: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)', unit: "%", warning: 70, critical: 90 },
        { name: "Memory Usage", query: "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100", unit: "%", warning: 80, critical: 95 },
        { name: "Disk Usage", query: '(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100', unit: "%", warning: 80, critical: 90 },
        { name: "Error Rate", query: 'sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100', unit: "%", warning: 1, critical: 5 },
        { name: "P99 Latency", query: "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) * 1000", unit: "ms", warning: 500, critical: 1000 },
    ];

    try {
        const filtered = options.metricName
            ? metricQueries.filter((m) => m.name.toLowerCase().includes(options.metricName!.toLowerCase()))
            : metricQueries;

        const results = await Promise.all(
            filtered.map(async (m) => {
                const { result, error } = await queryPrometheus(m.query);
                if (error || result.length === 0) {
                    return { name: m.name, value: 0, unit: m.unit, status: "ok" as const };
                }

                const value = result[0].value;
                let status: "ok" | "warning" | "critical" = "ok";
                if (value >= m.critical) status = "critical";
                else if (value >= m.warning) status = "warning";

                return { name: m.name, value: Math.round(value * 100) / 100, unit: m.unit, status };
            })
        );

        return { metrics: results };
    } catch (error) {
        return {
            metrics: [],
            error: error instanceof Error ? error.message : "Failed to fetch metrics",
        };
    }
}
