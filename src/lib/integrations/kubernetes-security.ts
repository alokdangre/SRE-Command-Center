/**
 * Kubernetes security validation helpers.
 * Enforces safer defaults for production cluster connectivity.
 */

const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const NAMESPACE_PATTERN = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

interface KubernetesConfigInput {
  cluster_url?: string;
  token?: string;
  default_namespace?: string;
  namespaces?: string[];
  ca_cert?: string;
  skip_tls_verify?: boolean;
}

export interface NormalizedKubernetesConfig {
  clusterUrl: string;
  token: string;
  defaultNamespace: string;
  allowedNamespaces: string[];
  caCert?: string;
  skipTlsVerify: boolean;
}

export interface KubernetesValidationResult {
  success: boolean;
  error?: string;
  config?: NormalizedKubernetesConfig;
}

function normalizeNamespace(value: string): string {
  return value.trim().toLowerCase();
}

function hasWhitespace(value: string): boolean {
  return /\s/.test(value);
}

function isLocalhost(url: URL): boolean {
  return LOCALHOST_HOSTS.has(url.hostname);
}

function validateNamespace(namespace: string): string | null {
  if (!namespace) return "Namespace cannot be empty.";
  if (namespace.length > 63) {
    return `Namespace "${namespace}" exceeds 63 characters.`;
  }
  if (!NAMESPACE_PATTERN.test(namespace)) {
    return `Namespace "${namespace}" is not a valid Kubernetes DNS label.`;
  }
  return null;
}

function validateClusterUrl(rawUrl?: string): { url?: URL; error?: string } {
  if (!rawUrl?.trim()) {
    return { error: "Kubernetes cluster URL is required." };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    return { error: "Kubernetes cluster URL is invalid." };
  }

  if (!parsed.hostname) {
    return { error: "Kubernetes cluster URL must include a hostname." };
  }

  if (parsed.username || parsed.password) {
    return { error: "Kubernetes URL must not include embedded credentials." };
  }

  if (parsed.search || parsed.hash) {
    return { error: "Kubernetes URL must not include query parameters or fragments." };
  }

  if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && isLocalhost(parsed))) {
    return {
      error:
        "Kubernetes URL must use HTTPS in non-local environments. HTTP is allowed only for localhost.",
    };
  }

  return { url: parsed };
}

function validateServiceAccountToken(token?: string): string | null {
  const normalized = token?.trim() || "";
  if (!normalized) {
    return "Service account token is required.";
  }
  if (normalized.length < 20) {
    return "Service account token appears invalid (too short).";
  }
  if (hasWhitespace(normalized)) {
    return "Service account token must not contain whitespace.";
  }
  return null;
}

function normalizeAllowedNamespaces(
  namespaces?: string[],
  defaultNamespace?: string,
): string[] {
  const deduped = new Set<string>();
  const all = [...(namespaces || [])];

  if (defaultNamespace) {
    all.push(defaultNamespace);
  }

  for (const namespace of all) {
    const normalized = normalizeNamespace(namespace);
    if (normalized) {
      deduped.add(normalized);
    }
  }

  return Array.from(deduped);
}

export function validateAndNormalizeKubernetesConfig(
  input: KubernetesConfigInput,
): KubernetesValidationResult {
  const clusterCheck = validateClusterUrl(input.cluster_url);
  if (!clusterCheck.url) {
    return { success: false, error: clusterCheck.error };
  }

  const tokenError = validateServiceAccountToken(input.token);
  if (tokenError) {
    return { success: false, error: tokenError };
  }

  const defaultNamespace = normalizeNamespace(
    input.default_namespace || "default",
  );
  const defaultNamespaceError = validateNamespace(defaultNamespace);
  if (defaultNamespaceError) {
    return { success: false, error: defaultNamespaceError };
  }

  const allowedNamespaces = normalizeAllowedNamespaces(
    input.namespaces,
    defaultNamespace,
  );
  if (allowedNamespaces.length === 0) {
    return {
      success: false,
      error: "At least one allowed namespace is required.",
    };
  }
  if (allowedNamespaces.length > 20) {
    return {
      success: false,
      error: "Too many namespaces configured. Limit allowed namespaces to 20.",
    };
  }

  for (const namespace of allowedNamespaces) {
    const namespaceError = validateNamespace(namespace);
    if (namespaceError) {
      return { success: false, error: namespaceError };
    }
  }

  if (!allowedNamespaces.includes(defaultNamespace)) {
    return {
      success: false,
      error: "Default namespace must be included in allowed namespaces.",
    };
  }

  const skipTlsVerify = Boolean(input.skip_tls_verify);
  if (skipTlsVerify && !isLocalhost(clusterCheck.url)) {
    return {
      success: false,
      error:
        "skip_tls_verify is only allowed for localhost development clusters.",
    };
  }

  const caCert = input.ca_cert?.trim();
  if (caCert && caCert.length > 32768) {
    return {
      success: false,
      error: "CA certificate payload is too large.",
    };
  }

  return {
    success: true,
    config: {
      clusterUrl: clusterCheck.url.toString().replace(/\/$/, ""),
      token: input.token!.trim(),
      defaultNamespace,
      allowedNamespaces,
      caCert: caCert || undefined,
      skipTlsVerify,
    },
  };
}

export function extractNamespaceFromKubernetesEndpoint(
  endpoint: string,
): string | null {
  const match = endpoint.match(/\/namespaces\/([^/?#]+)/);
  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]).trim().toLowerCase();
  } catch {
    return match[1].trim().toLowerCase();
  }
}
