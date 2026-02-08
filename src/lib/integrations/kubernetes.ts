/**
 * Kubernetes Integration
 * Fetches pod/deployment status and executes safe remediation actions.
 */

import { getIntegrationConfig } from "./config";
import {
    extractNamespaceFromKubernetesEndpoint,
    validateAndNormalizeKubernetesConfig,
} from "./kubernetes-security";

export interface KubernetesPod {
    name: string;
    namespace: string;
    phase: "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";
    ready: boolean;
    restarts: number;
    age: string;
    nodeName?: string;
    podIP?: string;
}

export interface KubernetesDeployment {
    name: string;
    namespace: string;
    replicas: number;
    readyReplicas: number;
    availableReplicas: number;
    updatedReplicas: number;
    unavailableReplicas: number;
    image?: string;
    status: "healthy" | "degraded" | "critical";
    revision?: number;
}

interface ReplicaSetRevision {
    revision: number;
    createdAt: string;
    template?: Record<string, unknown>;
}

async function kubernetesRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const config = await getIntegrationConfig();

    if (!config.kubernetes.enabled || !config.kubernetes.clusterUrl || !config.kubernetes.token) {
        throw new Error("Kubernetes integration not configured");
    }

    const validation = validateAndNormalizeKubernetesConfig({
        cluster_url: config.kubernetes.clusterUrl,
        token: config.kubernetes.token,
        default_namespace: config.kubernetes.defaultNamespace,
        namespaces: config.kubernetes.allowedNamespaces,
        ca_cert: config.kubernetes.caCert,
        skip_tls_verify: config.kubernetes.skipTlsVerify,
    });
    if (!validation.success || !validation.config) {
        throw new Error(validation.error || "Kubernetes integration failed security validation");
    }

    const endpointNamespace = extractNamespaceFromKubernetesEndpoint(endpoint);
    if (
        endpointNamespace &&
        !validation.config.allowedNamespaces.includes(endpointNamespace)
    ) {
        throw new Error(
            `Namespace "${endpointNamespace}" is outside the configured allowlist.`,
        );
    }

    const url = `${validation.config.clusterUrl}${endpoint}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
        return await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${validation.config.token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            ...options.headers,
        },
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timeout);
    }
}

function getAge(isoTimestamp: string): string {
    const now = Date.now();
    const created = new Date(isoTimestamp).getTime();
    const diffMinutes = Math.max(1, Math.floor((now - created) / 60000));

    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    return `${Math.floor(diffHours / 24)}d`;
}

function labelSelectorFromMatchLabels(matchLabels?: Record<string, string>): string {
    if (!matchLabels || Object.keys(matchLabels).length === 0) {
        return "";
    }

    return Object.entries(matchLabels)
        .map(([key, value]) => `${key}=${value}`)
        .join(",");
}

/**
 * Get pod status for a namespace.
 */
export async function getPodStatus(namespace = "default"): Promise<{
    pods: KubernetesPod[];
    error?: string;
}> {
    try {
        const response = await kubernetesRequest(`/api/v1/namespaces/${encodeURIComponent(namespace)}/pods?limit=200`);

        if (!response.ok) {
            throw new Error(`Kubernetes API error: ${response.status}`);
        }

        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];

        const pods: KubernetesPod[] = items.map((pod: {
            metadata: { name: string; namespace: string; creationTimestamp: string };
            status: {
                phase: KubernetesPod["phase"];
                podIP?: string;
                containerStatuses?: Array<{ ready: boolean; restartCount: number }>;
            };
            spec?: { nodeName?: string };
        }) => {
            const containerStatuses = pod.status.containerStatuses || [];
            const ready = containerStatuses.length > 0 && containerStatuses.every(s => s.ready);
            const restarts = containerStatuses.reduce((sum, s) => sum + (s.restartCount || 0), 0);

            return {
                name: pod.metadata.name,
                namespace: pod.metadata.namespace,
                phase: pod.status.phase || "Unknown",
                ready,
                restarts,
                age: getAge(pod.metadata.creationTimestamp),
                nodeName: pod.spec?.nodeName,
                podIP: pod.status.podIP,
            };
        });

        return { pods };
    } catch (error) {
        return {
            pods: [],
            error: error instanceof Error ? error.message : "Failed to fetch pod status",
        };
    }
}

/**
 * Get deployments for a namespace.
 */
export async function getDeployments(namespace = "default"): Promise<{
    deployments: KubernetesDeployment[];
    error?: string;
}> {
    try {
        const response = await kubernetesRequest(`/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments?limit=200`);

        if (!response.ok) {
            throw new Error(`Kubernetes API error: ${response.status}`);
        }

        const data = await response.json();
        const items = Array.isArray(data.items) ? data.items : [];

        const deployments: KubernetesDeployment[] = items.map((dep: {
            metadata: { name: string; namespace: string; annotations?: Record<string, string> };
            spec: {
                replicas?: number;
                template?: {
                    spec?: {
                        containers?: Array<{ image?: string }>;
                    };
                };
            };
            status: {
                readyReplicas?: number;
                availableReplicas?: number;
                updatedReplicas?: number;
                unavailableReplicas?: number;
            };
        }) => {
            const replicas = dep.spec.replicas || 0;
            const readyReplicas = dep.status.readyReplicas || 0;
            const availableReplicas = dep.status.availableReplicas || 0;
            const unavailableReplicas = dep.status.unavailableReplicas || 0;
            const revision = Number(dep.metadata.annotations?.["deployment.kubernetes.io/revision"] || "0");

            let status: KubernetesDeployment["status"] = "healthy";
            if (availableReplicas === 0 && replicas > 0) {
                status = "critical";
            } else if (unavailableReplicas > 0 || readyReplicas < replicas) {
                status = "degraded";
            }

            return {
                name: dep.metadata.name,
                namespace: dep.metadata.namespace,
                replicas,
                readyReplicas,
                availableReplicas,
                updatedReplicas: dep.status.updatedReplicas || 0,
                unavailableReplicas,
                image: dep.spec.template?.spec?.containers?.[0]?.image,
                status,
                revision: Number.isFinite(revision) ? revision : 0,
            };
        });

        return { deployments };
    } catch (error) {
        return {
            deployments: [],
            error: error instanceof Error ? error.message : "Failed to fetch deployments",
        };
    }
}

/**
 * Restart deployment by updating pod template annotation.
 */
export async function restartDeployment(name: string, namespace: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const response = await kubernetesRequest(
            `/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments/${encodeURIComponent(name)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/strategic-merge-patch+json",
                },
                body: JSON.stringify({
                    spec: {
                        template: {
                            metadata: {
                                annotations: {
                                    "kubectl.kubernetes.io/restartedAt": new Date().toISOString(),
                                },
                            },
                        },
                    },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Kubernetes API error: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to restart deployment",
        };
    }
}

/**
 * Scale deployment to desired replica count.
 */
export async function scaleDeployment(
    name: string,
    namespace: string,
    replicas: number
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await kubernetesRequest(
            `/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments/${encodeURIComponent(name)}/scale`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/merge-patch+json",
                },
                body: JSON.stringify({
                    spec: { replicas },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Kubernetes API error: ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to scale deployment",
        };
    }
}

/**
 * Roll back deployment to previous ReplicaSet revision (best effort).
 */
export async function rollbackDeployment(
    name: string,
    namespace: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const depResponse = await kubernetesRequest(
            `/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments/${encodeURIComponent(name)}`
        );

        if (!depResponse.ok) {
            throw new Error(`Kubernetes API error: ${depResponse.status}`);
        }

        const deployment = await depResponse.json();
        const selector = labelSelectorFromMatchLabels(deployment.spec?.selector?.matchLabels);

        if (!selector) {
            return { success: false, error: "Unable to derive deployment selector for rollback" };
        }

        const rsResponse = await kubernetesRequest(
            `/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/replicasets?labelSelector=${encodeURIComponent(selector)}`
        );

        if (!rsResponse.ok) {
            throw new Error(`Kubernetes API error: ${rsResponse.status}`);
        }

        const rsData = await rsResponse.json();
        const replicaSetItems: Array<{
            metadata?: { annotations?: Record<string, string>; creationTimestamp?: string };
            spec?: { template?: Record<string, unknown> };
        }> = Array.isArray(rsData.items) ? rsData.items : [];

        const replicaSets: ReplicaSetRevision[] = replicaSetItems
            .map((rs) => ({
                revision: Number(rs.metadata?.annotations?.["deployment.kubernetes.io/revision"] || "0"),
                createdAt: rs.metadata?.creationTimestamp || "",
                template: rs.spec?.template,
            }))
            .filter((rs): rs is ReplicaSetRevision & { template: Record<string, unknown> } =>
                Number.isFinite(rs.revision) && rs.revision > 0 && !!rs.template
            )
            .sort((a, b) => b.revision - a.revision || b.createdAt.localeCompare(a.createdAt));

        if (replicaSets.length < 2) {
            return { success: false, error: "No previous ReplicaSet revision found for rollback" };
        }

        const previousTemplate = replicaSets[1].template;

        const patchResponse = await kubernetesRequest(
            `/apis/apps/v1/namespaces/${encodeURIComponent(namespace)}/deployments/${encodeURIComponent(name)}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/strategic-merge-patch+json",
                },
                body: JSON.stringify({
                    spec: {
                        template: previousTemplate,
                    },
                }),
            }
        );

        if (!patchResponse.ok) {
            throw new Error(`Kubernetes API error: ${patchResponse.status}`);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to rollback deployment",
        };
    }
}

/**
 * Fetch pod logs.
 */
export async function getPodLogs(
    podName: string,
    namespace: string
): Promise<{ logs: string; error?: string }> {
    try {
        const response = await kubernetesRequest(
            `/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(podName)}/log?tailLines=200`
        );

        if (!response.ok) {
            throw new Error(`Kubernetes API error: ${response.status}`);
        }

        const logs = await response.text();
        return { logs };
    } catch (error) {
        return {
            logs: "",
            error: error instanceof Error ? error.message : "Failed to fetch pod logs",
        };
    }
}
