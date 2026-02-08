"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    Settings,
    Bot,
    Github,
    Activity,
    MessageSquare,
    Box,
    Bell,
    Check,
    X,
    Loader2,
    ChevronLeft,
    ExternalLink,
    AlertCircle,
    Plug,
    Shield,
} from "lucide-react";
import {
    getUserIntegrations,
    saveIntegration,
    deleteIntegration,
    verifyGitHubIntegration,
    verifyPrometheusIntegration,
    verifyKubernetesIntegration,
} from "@/services/integration-service";
import { INTEGRATION_INFO, type IntegrationType, type UserIntegration } from "@/types/integrations";
import { UserNav } from "@/components/auth/user-nav";
import { signInWithGitHub } from "@/app/auth/actions";
import {
    getDefaultModelSelection,
    getProviderModels,
    readModelSelection,
    writeModelSelection,
    type ModelProvider,
    type ModelSelection,
} from "@/lib/model-selection";

const ICONS: Record<string, React.ElementType> = {
    github: Github,
    activity: Activity,
    "message-square": MessageSquare,
    box: Box,
    bell: Bell,
};

export default function SettingsPage() {
    const [integrations, setIntegrations] = useState<UserIntegration[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSetup, setActiveSetup] = useState<IntegrationType | null>(null);
    const [modelSelection, setModelSelection] = useState<ModelSelection>(getDefaultModelSelection());
    const [modelSaved, setModelSaved] = useState(false);

    useEffect(() => {
        loadIntegrations();
        setModelSelection(readModelSelection());
    }, []);

    async function loadIntegrations() {
        try {
            const data = await getUserIntegrations();
            setIntegrations(data);
        } catch (error) {
            console.error("Failed to load integrations:", error);
        } finally {
            setLoading(false);
        }
    }

    function getIntegrationStatus(type: IntegrationType) {
        const integration = integrations.find(i => i.integration_type === type);
        return {
            connected: !!integration,
            enabled: integration?.is_enabled ?? false,
            error: integration?.last_error,
            lastVerified: integration?.last_verified_at,
        };
    }

    function handleProviderChange(provider: ModelProvider) {
        const providerModels = getProviderModels(provider);
        setModelSelection({
            provider,
            model: providerModels[0] || "",
        });
        setModelSaved(false);
    }

    function handleModelChange(model: string) {
        setModelSelection((prev) => ({ ...prev, model }));
        setModelSaved(false);
    }

    function saveModelPreference() {
        writeModelSelection(modelSelection);
        setModelSaved(true);
        setTimeout(() => setModelSaved(false), 2000);
    }

    const providerModels = getProviderModels(modelSelection.provider);

    return (
        <div className="min-h-screen bg-black text-white font-mono">
            {/* Scanline Effect */}
            <div className="scanline" />

            {/* Header */}
            <header className="border-b border-cyan-500/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/sre" className="flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-widest">BACK</span>
                        </Link>
                        <div className="h-4 w-px bg-cyan-500/20" />
                        <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-cyan-400" />
                            <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest">
                                SETTINGS
                            </span>
                        </div>
                    </div>
                    <UserNav />
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                        <Plug className="w-6 h-6 text-cyan-400" />
                        Integrations
                    </h1>
                    <p className="text-gray-400 text-sm">
                        Connect your infrastructure tools to enable real-time monitoring and AI-powered incident analysis.
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
                    </div>
                ) : activeSetup ? (
                    <IntegrationSetup
                        type={activeSetup}
                        onClose={() => setActiveSetup(null)}
                        onSave={loadIntegrations}
                    />
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.values(INTEGRATION_INFO).map((info) => {
                            const status = getIntegrationStatus(info.type);
                            const Icon = ICONS[info.icon] || Activity;

                            return (
                                <div
                                    key={info.type}
                                    className={`border rounded-lg p-5 transition-all ${status.connected
                                        ? "border-green-500/30 bg-green-500/5"
                                        : "border-gray-800 bg-black/40 hover:border-cyan-500/30"
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${status.connected ? "bg-green-500/20" : "bg-gray-800"
                                                }`}>
                                                <Icon className={`w-5 h-5 ${status.connected ? "text-green-400" : "text-gray-400"
                                                    }`} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{info.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {status.connected ? (
                                                        <span className="text-green-400 flex items-center gap-1">
                                                            <Check className="w-3 h-3" /> Connected
                                                        </span>
                                                    ) : (
                                                        "Not configured"
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-400 mb-4">
                                        {info.description}
                                    </p>

                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {info.features.slice(0, 3).map((feature) => (
                                            <span
                                                key={feature}
                                                className="text-[10px] px-2 py-1 bg-gray-800 text-gray-400 rounded"
                                            >
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    {status.error && (
                                        <div className="mb-4 text-xs text-red-400 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {status.error}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setActiveSetup(info.type)}
                                        className={`w-full py-2 text-xs uppercase tracking-widest font-bold rounded transition-colors ${status.connected
                                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                                            : "bg-cyan-500 text-black hover:bg-cyan-400"
                                            }`}
                                    >
                                        {status.connected ? "MANAGE" : "CONNECT"}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && !activeSetup && (
                    <div className="mt-8 border border-gray-800 rounded-lg p-6 bg-black/40">
                        <div className="flex items-start gap-3 mb-4">
                            <Bot className="w-5 h-5 text-cyan-400 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-white">AI Model Selection</h3>
                                <p className="text-xs text-gray-400">
                                    Choose preferred provider/model for new chat requests. Preference is stored in your browser.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Provider
                                </label>
                                <select
                                    value={modelSelection.provider}
                                    onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
                                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                                >
                                    <option value="openai">OpenAI</option>
                                    <option value="anthropic">Anthropic</option>
                                    <option value="google">Google</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Model
                                </label>
                                <select
                                    value={modelSelection.model}
                                    onChange={(e) => handleModelChange(e.target.value)}
                                    className="w-full bg-black border border-gray-700 rounded px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none"
                                >
                                    {providerModels.map((model) => (
                                        <option key={model} value={model}>
                                            {model}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <button
                                onClick={saveModelPreference}
                                className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded text-xs font-bold uppercase tracking-widest transition-colors"
                            >
                                Save Model Preference
                            </button>
                            {modelSaved && (
                                <span className="text-xs text-green-400 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Saved
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Security Notice */}
                <div className="mt-12 border border-gray-800 rounded-lg p-6 bg-black/40">
                    <div className="flex items-start gap-4">
                        <Shield className="w-6 h-6 text-cyan-400 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-white mb-2">Security & Privacy</h3>
                            <p className="text-sm text-gray-400">
                                Your integration credentials are encrypted and stored securely. We use OAuth where
                                available so we never see your passwords. You can disconnect integrations at any time.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Integration Setup Component
function IntegrationSetup({
    type,
    onClose,
    onSave
}: {
    type: IntegrationType;
    onClose: () => void;
    onSave: () => void;
}) {
    const info = INTEGRATION_INFO[type];
    const Icon = ICONS[info.icon] || Activity;
    const [saving, setSaving] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Form states for different integration types
    const [githubPat, setGithubPat] = useState("");
    const [githubRepos, setGithubRepos] = useState("");
    const [prometheusUrl, setPrometheusUrl] = useState("");
    const [prometheusUser, setPrometheusUser] = useState("");
    const [prometheusPass, setPrometheusPass] = useState("");
    const [pagerdutyApiKey, setPagerdutyApiKey] = useState("");
    const [pagerdutyServices, setPagerdutyServices] = useState("");
    const [kubernetesClusterName, setKubernetesClusterName] = useState("");
    const [kubernetesClusterUrl, setKubernetesClusterUrl] = useState("");
    const [kubernetesToken, setKubernetesToken] = useState("");
    const [kubernetesCaCert, setKubernetesCaCert] = useState("");
    const [kubernetesSkipTlsVerify, setKubernetesSkipTlsVerify] = useState(false);
    const [kubernetesDefaultNamespace, setKubernetesDefaultNamespace] = useState("default");
    const [kubernetesNamespaces, setKubernetesNamespaces] = useState("default");

    async function handleGitHubOAuth() {
        // Redirect to GitHub OAuth via Supabase
        await signInWithGitHub();
    }

    async function handleSaveGitHub() {
        setSaving(true);
        setError(null);

        try {
            const config = {
                type: 'pat' as const,
                pat: githubPat,
                repos: githubRepos.split(',').map(r => r.trim()).filter(Boolean),
            };

            // Verify first
            setVerifying(true);
            const verification = await verifyGitHubIntegration(config);
            setVerifying(false);

            if (!verification.success) {
                throw new Error(verification.error);
            }

            // Save with username
            await saveIntegration('github', { ...config, username: verification.username });
            setSuccess(true);
            onSave();
            setTimeout(onClose, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleSavePrometheus() {
        setSaving(true);
        setError(null);

        try {
            const config = {
                url: prometheusUrl,
                username: prometheusUser || undefined,
                password: prometheusPass || undefined,
            };

            // Verify first
            setVerifying(true);
            const verification = await verifyPrometheusIntegration(config);
            setVerifying(false);

            if (!verification.success) {
                throw new Error(verification.error);
            }

            await saveIntegration('prometheus', config);
            setSuccess(true);
            onSave();
            setTimeout(onClose, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleSavePagerDuty() {
        setSaving(true);
        setError(null);

        try {
            // Verify first by making a test call
            setVerifying(true);
            const response = await fetch("https://api.pagerduty.com/users/me", {
                headers: {
                    Authorization: `Token token=${pagerdutyApiKey}`,
                    "Content-Type": "application/json",
                    Accept: "application/vnd.pagerduty+json;version=2",
                },
            });
            setVerifying(false);

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Invalid API key");
                }
                throw new Error(`PagerDuty API error: ${response.status}`);
            }

            const config = {
                api_key: pagerdutyApiKey,
                service_ids: pagerdutyServices.split(',').map(s => s.trim()).filter(Boolean),
            };

            await saveIntegration('pagerduty', config);
            setSuccess(true);
            onSave();
            setTimeout(onClose, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleSaveKubernetes() {
        setSaving(true);
        setError(null);

        try {
            const namespaceList = kubernetesNamespaces
                .split(',')
                .map(ns => ns.trim())
                .filter(Boolean);

            const config = {
                type: 'service_account' as const,
                cluster_name: kubernetesClusterName || 'Default Cluster',
                cluster_url: kubernetesClusterUrl,
                token: kubernetesToken,
                ca_cert: kubernetesCaCert || undefined,
                skip_tls_verify: kubernetesSkipTlsVerify,
                default_namespace: kubernetesDefaultNamespace || namespaceList[0] || 'default',
                namespaces: namespaceList.length > 0 ? namespaceList : ['default'],
            };

            // Verify first
            setVerifying(true);
            const verification = await verifyKubernetesIntegration(config);
            setVerifying(false);

            if (!verification.success) {
                throw new Error(verification.error);
            }

            await saveIntegration('kubernetes', config);
            setSuccess(true);
            onSave();
            setTimeout(onClose, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleDisconnect() {
        try {
            await deleteIntegration(type);
            onSave();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to disconnect');
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                        <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Connect {info.name}</h2>
                        <p className="text-xs text-gray-400">{info.description}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-800 rounded transition-colors"
                >
                    <X className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {success ? (
                <div className="border border-green-500/30 bg-green-500/10 rounded-lg p-8 text-center">
                    <Check className="w-12 h-12 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-green-400 mb-2">Connected Successfully!</h3>
                    <p className="text-sm text-gray-400">Your {info.name} integration is now active.</p>
                </div>
            ) : (
                <div className="border border-gray-800 rounded-lg p-6 bg-black/40">
                    {/* GitHub Setup */}
                    {type === 'github' && (
                        <div className="space-y-6">
                            {/* OAuth Option */}
                            <div className="pb-6 border-b border-gray-800">
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                                    Option 1: OAuth (Recommended)
                                </h3>
                                <p className="text-xs text-gray-400 mb-4">
                                    Sign in with GitHub to securely connect your repositories.
                                </p>
                                <button
                                    onClick={handleGitHubOAuth}
                                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-sm transition-colors"
                                >
                                    <Github className="w-4 h-4" />
                                    Sign in with GitHub
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                </button>
                            </div>

                            {/* PAT Option */}
                            <div>
                                <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
                                    Option 2: Personal Access Token
                                </h3>
                                <p className="text-xs text-gray-400 mb-4">
                                    Create a token at{" "}
                                    <a
                                        href="https://github.com/settings/tokens"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-400 hover:underline"
                                    >
                                        github.com/settings/tokens
                                    </a>
                                    {" "}with <code className="bg-gray-800 px-1">repo</code> scope.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                            Personal Access Token
                                        </label>
                                        <input
                                            type="password"
                                            value={githubPat}
                                            onChange={(e) => setGithubPat(e.target.value)}
                                            placeholder="ghp_xxxxxxxxxxxx"
                                            className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                            Repositories to Monitor (comma-separated)
                                        </label>
                                        <input
                                            type="text"
                                            value={githubRepos}
                                            onChange={(e) => setGithubRepos(e.target.value)}
                                            placeholder="owner/repo1, owner/repo2"
                                            className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Prometheus Setup */}
                    {type === 'prometheus' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Prometheus Server URL
                                </label>
                                <input
                                    type="text"
                                    value={prometheusUrl}
                                    onChange={(e) => setPrometheusUrl(e.target.value)}
                                    placeholder="https://prometheus.your-domain.com:9090"
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                        Username (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={prometheusUser}
                                        onChange={(e) => setPrometheusUser(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                        Password (optional)
                                    </label>
                                    <input
                                        type="password"
                                        value={prometheusPass}
                                        onChange={(e) => setPrometheusPass(e.target.value)}
                                        placeholder="Optional"
                                        className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PagerDuty Setup */}
                    {type === 'pagerduty' && (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400 mb-4">
                                Create an API token at{" "}
                                <a
                                    href="https://support.pagerduty.com/docs/api-access-keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline"
                                >
                                    PagerDuty API Access Keys
                                </a>
                                . You&apos;ll need a user token or service account token with read access.
                            </p>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    API Key
                                </label>
                                <input
                                    type="password"
                                    value={pagerdutyApiKey}
                                    onChange={(e) => setPagerdutyApiKey(e.target.value)}
                                    placeholder="u+xxxxxxxxxxxxxxxxx"
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Service IDs to Monitor (optional, comma-separated)
                                </label>
                                <input
                                    type="text"
                                    value={pagerdutyServices}
                                    onChange={(e) => setPagerdutyServices(e.target.value)}
                                    placeholder="Leave empty to monitor all services"
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Find service IDs in PagerDuty: Services → Select Service → Copy ID from URL
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Kubernetes Setup */}
                    {type === 'kubernetes' && (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400 mb-4">
                                Use a Kubernetes API endpoint and service account token with least-privilege
                                permissions for deployments/pods in approved namespaces.
                            </p>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Cluster Name
                                </label>
                                <input
                                    type="text"
                                    value={kubernetesClusterName}
                                    onChange={(e) => setKubernetesClusterName(e.target.value)}
                                    placeholder="Production Cluster"
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Kubernetes API URL
                                </label>
                                <input
                                    type="text"
                                    value={kubernetesClusterUrl}
                                    onChange={(e) => setKubernetesClusterUrl(e.target.value)}
                                    placeholder="https://kubernetes.default.svc"
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    Service Account Token
                                </label>
                                <input
                                    type="password"
                                    value={kubernetesToken}
                                    onChange={(e) => setKubernetesToken(e.target.value)}
                                    placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6..."
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                    CA Certificate (optional)
                                </label>
                                <textarea
                                    value={kubernetesCaCert}
                                    onChange={(e) => setKubernetesCaCert(e.target.value)}
                                    placeholder="-----BEGIN CERTIFICATE-----..."
                                    rows={4}
                                    className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    Paste the PEM-encoded cluster CA certificate for stricter TLS validation.
                                </p>
                            </div>
                            <label className="flex items-start gap-3 p-3 border border-amber-500/30 rounded bg-amber-500/5">
                                <input
                                    type="checkbox"
                                    checked={kubernetesSkipTlsVerify}
                                    onChange={(e) => setKubernetesSkipTlsVerify(e.target.checked)}
                                    className="mt-0.5 w-4 h-4 accent-amber-500"
                                />
                                <span className="text-xs text-amber-300">
                                    Allow insecure TLS verification (localhost dev only). This is blocked for non-local clusters.
                                </span>
                            </label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                        Default Namespace
                                    </label>
                                    <input
                                        type="text"
                                        value={kubernetesDefaultNamespace}
                                        onChange={(e) => setKubernetesDefaultNamespace(e.target.value)}
                                        placeholder="default"
                                        className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                                        Allowed Namespaces
                                    </label>
                                    <input
                                        type="text"
                                        value={kubernetesNamespaces}
                                        onChange={(e) => setKubernetesNamespaces(e.target.value)}
                                        placeholder="default, production"
                                        className="w-full bg-black border border-gray-700 rounded px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Live remediation is disabled by default. Set <code>ENABLE_K8S_REMEDIATION=true</code>
                                {" "}and optional <code>ENABLE_K8S_ROLLBACK=true</code> to allow action execution.
                            </p>
                        </div>
                    )}

                    {/* Slack - Coming Soon */}
                    {type === 'slack' && (
                        <div className="space-y-4">
                            <p className="text-xs text-gray-400 mb-2">
                                Install and authorize your Slack app to enable incident channel context.
                                This stores a workspace token scoped to your account.
                            </p>
                            <a
                                href="/auth/slack/start"
                                className="flex items-center justify-center gap-2 w-full py-3 bg-[#4A154B] hover:bg-[#5f1d60] text-white rounded font-bold text-sm transition-colors"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Connect with Slack
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                            <p className="text-xs text-gray-500">
                                Required server env vars: <code>SLACK_CLIENT_ID</code> and <code>SLACK_CLIENT_SECRET</code>.
                            </p>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    {(type === 'github' || type === 'prometheus' || type === 'pagerduty' || type === 'kubernetes') && (
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded font-bold text-sm uppercase tracking-wider transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={
                                    type === 'github'
                                        ? handleSaveGitHub
                                        : type === 'prometheus'
                                            ? handleSavePrometheus
                                            : type === 'pagerduty'
                                                ? handleSavePagerDuty
                                                : handleSaveKubernetes
                                }
                                disabled={
                                    saving ||
                                    (type === 'github' && !githubPat) ||
                                    (type === 'prometheus' && !prometheusUrl) ||
                                    (type === 'pagerduty' && !pagerdutyApiKey) ||
                                    (type === 'kubernetes' && (!kubernetesClusterUrl || !kubernetesToken))
                                }
                                className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-black rounded font-bold text-sm uppercase tracking-wider transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                {verifying ? "VERIFYING..." : saving ? "SAVING..." : "CONNECT"}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Disconnect Button (if already connected) */}
            <div className="mt-4 text-center">
                <button
                    onClick={handleDisconnect}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                    Disconnect this integration
                </button>
            </div>
        </div>
    );
}
