# Tambo Feature Checklist

> **Track all Tambo features used in SRE Command Center and identify what's left to implement.**

Manual QA guide: `docs/MANUAL_TEST_USER_FLOWS.md`

---

## 📊 Progress Overview

| Category                | Implemented | Remaining | Total  |
| ----------------------- | ----------- | --------- | ------ |
| Generative Components   | 5           | 0         | 5      |
| Interactable Components | 3           | 0         | 3      |
| Local Tools             | 8           | 0         | 8      |
| Backend Tools           | 13          | 0         | 13     |
| Integrations            | 5           | 0         | 5      |
| Core Features           | 11          | 0         | 11     |
| Authentication          | 1           | 0         | 1      |
| **Total**               | **46**      | **0**     | **46** |

---

## ✅ Generative Components

Components rendered by AI in response to user messages.

| Component           | Description                       | Status  | File                                     |
| ------------------- | --------------------------------- | ------- | ---------------------------------------- |
| `ServiceStatusGrid` | Grid of service health cards      | ✅ Done | `components/sre/service-status-grid.tsx` |
| `AnomalyHeatmap`    | Service anomaly visualization     | ✅ Done | `components/sre/anomaly-heatmap.tsx`     |
| `IncidentTimeline`  | Chronological event feed          | ✅ Done | `components/sre/incident-timeline.tsx`   |
| `RootCauseAnalysis` | AI-generated root cause           | ✅ Done | `components/sre/root-cause-analysis.tsx` |
| `AlertSummary`      | Active alerts grouped by severity | ✅ Done | `components/sre/alert-summary.tsx`       |
| `Graph`             | Generic chart component           | ✅ Done | `components/ui/graph.tsx`                |

---

## ✅ Interactable Components

Components that persist on page and update by ID across conversations.

| Component          | Description                      | Status  | Notes                         |
| ------------------ | -------------------------------- | ------- | ----------------------------- |
| `ServiceCard`      | Interactable service status card | ✅ Done | `components/sre/interactable-service-card.tsx` |
| `IncidentNotes`    | Shared notes for incident        | ✅ Done | `components/sre/incident-notes.tsx` |
| `RemediationPanel` | Persistent action panel          | ✅ Done | `components/sre/remediation-panel.tsx` |

### How to Implement

```typescript
import { withInteractable } from "@tambo-ai/react";
import { ServiceCard } from "./service-card";

export const InteractableServiceCard = withInteractable(ServiceCard, {
  componentName: "ServiceCard",
  description: "A service status card that AI can update with new metrics",
  propsSchema: z.object({
    serviceName: z.string(),
    status: z.enum(["healthy", "degraded", "critical"]),
    metrics: z.object({...}),
  }),
});
```

---

## ✅ Local Tools (Browser-Side)

Functions that execute in the browser.

| Tool                      | Description               | Status  | File                      |
| ------------------------- | ------------------------- | ------- | ------------------------- |
| `flushLocalCache`         | Clear browser storage     | ✅ Done | `services/local-tools.ts` |
| `restartSession`          | Reload session state      | ✅ Done | `services/local-tools.ts` |
| `copyToClipboard`         | Copy text to clipboard    | ✅ Done | `services/local-tools.ts` |
| `getBrowserPerformance`   | Get browser perf metrics  | ✅ Done | `services/local-tools.ts` |
| `sendBrowserNotification` | Send desktop notification | ✅ Done | `services/local-tools.ts` |
| `exportIncidentData`      | Download JSON file        | ✅ Done | `services/local-tools.ts` |
| `playAlertSound`          | Play audio alert          | ✅ Done | `services/local-tools.ts` |
| `getTimezoneInfo`         | Get user timezone         | ✅ Done | `services/local-tools.ts` |

---

## ✅ Backend Tools (Server-Side)

Functions executed server-side. Now connected to real integrations with mock fallback.

| Tool                      | Description              | Status       | Data Source                  |
| ------------------------- | ------------------------ | ------------ | ---------------------------- |
| `getSystemOverview`       | High-level system health | ✅ Connected | Prometheus (mock fallback)   |
| `getServiceStatus`        | Detailed service metrics | ✅ Connected | Prometheus (mock fallback)   |
| `getActiveAlerts`         | List firing alerts       | ✅ Connected | Alertmanager (mock fallback) |
| `getHealthMetrics`        | CPU, memory, etc.        | ✅ Connected | Prometheus (mock fallback)   |
| `analyzeRecentCommits`    | Git commit analysis      | ✅ Connected | GitHub API (mock fallback)   |
| `getCurrentIncident`      | Active incident details  | ✅ Connected | PagerDuty (mock fallback)    |
| `getIncidentTimelineData` | Timeline data            | ✅ Connected | PagerDuty (mock fallback)    |
| `getRemediationOptions`   | Available fix actions    | ✅ Connected | Kubernetes API (mock fallback) |
| `executeRemediation`      | Trigger a fix            | ✅ Connected | Kubernetes API (guarded + mock fallback) |
| `getSlackContext`         | Team discussions         | ✅ Connected | Slack API (mock fallback)    |
| `getRootCauseAnalysis`    | AI root cause            | ✅ Connected | Multi-source aggregation (with fallback) |
| `getAnomalyHeatmapData`   | Heatmap data             | ✅ Connected | Prometheus range scoring (mock fallback) |
| `getIntegrations`         | Integration status       | ✅ Connected | Supabase                     |

### Remaining Integration Priority

1. ✅ No remaining integration blockers

---

## ✅ External Integrations

Integrations are configured through the **Settings > Integrations** page in the app UI.
Credentials are stored securely in Supabase (per-user). Falls back to mock data when not configured.

| Integration | Purpose             | Status  | Configuration                       |
| ----------- | ------------------- | ------- | ----------------------------------- |
| GitHub      | Commits, PRs, CI/CD | ✅ Done | Settings page (OAuth or PAT)        |
| Prometheus  | Metrics and alerts  | ✅ Done | Settings page (URL + optional auth) |
| PagerDuty   | Incident sync       | ✅ Done | Settings page (API key)             |
| Slack       | Team messages       | ✅ Done | OAuth flow + API integration |
| Kubernetes  | Pod/deployment info | ✅ Done | Settings form + token + namespace allowlist + TLS hardening validation |

### How Users Configure Integrations

1. **Login** to the SRE Command Center
2. Click the **Settings icon** (⚙️) in the header
3. Select the integration you want to configure
4. Enter credentials (OAuth login, API token, or server URL)
5. The app automatically verifies the connection
6. Integration is now active!

### GitHub Integration (Implemented)

Two authentication options:

- **OAuth (Recommended)**: Click "Sign in with GitHub" - no tokens to copy
- **Personal Access Token**: Paste a PAT with `repo` scope

Features:

- Recent commits with file changes and risk analysis
- Pull requests with labels and merge status
- Workflow runs for CI/CD monitoring

### Prometheus Integration (Implemented)

Enter your Prometheus server URL (and optional basic auth credentials).

Features:

- Service health (uptime, latency, error rates)
- System metrics (CPU, memory, disk)
- Active alerts from Alertmanager

### Database Schema

Integration credentials are stored in Supabase with Row Level Security:

```sql
-- See supabase/schema.sql for full schema
CREATE TABLE user_integrations (
    user_id UUID REFERENCES auth.users(id),
    integration_type TEXT,
    config JSONB,
    is_enabled BOOLEAN,
    -- ... timestamps, error tracking
);
```

### Developer Override (Optional)

For development/testing, env vars can override UI settings:

```bash
GITHUB_TOKEN=ghp_xxx
GITHUB_REPO=owner/repo
PROMETHEUS_URL=http://localhost:9090
```

---

## ✅ Core Features

Tambo SDK features and hooks.

| Feature                   | Description                    | Status  | Notes                    |
| ------------------------- | ------------------------------ | ------- | ------------------------ |
| `TamboProvider`           | Root provider component        | ✅ Done | In `app/layout.tsx`      |
| `useTamboThread`          | Access conversation thread     | ✅ Done | Used in chat components  |
| `useTamboThreadInput`     | Message input hook             | ✅ Done | Used in chat components  |
| `components` registration | Register generative components | ✅ Done | In `lib/tambo.ts`        |
| `tools` registration      | Register callable tools        | ✅ Done | In `lib/tambo.ts`        |
| Streaming support         | Real-time response streaming   | ✅ Done | Typing/stage indicators in thread UI |
| `useTamboState`           | AI-integrated state hooks      | ✅ Done | `src/hooks/use-tambo-state.ts` + runtime state sync in `src/components/tambo/tambo-runtime-context.tsx` |
| `useTamboContext`         | Pass context to AI             | ✅ Done | `src/hooks/use-tambo-context.ts` + user preference context in `src/components/tambo/tambo-runtime-context.tsx` |
| Suggested actions         | Generate user suggestions      | ✅ Done | SRE remediation quick-action buttons |
| Message history           | Conversation persistence       | ✅ Done | Thread snapshots persisted to Supabase (`thread_history`) |
| Model selection           | Switch AI models               | ✅ Done | Provider/model preference in Settings and request context |

---

## ✅ User Authentication with Tambo

Pass Supabase access token to Tambo for per-user auth.

| Feature                      | Status  | Notes                                 |
| ---------------------------- | ------- | ------------------------------------- |
| `userToken` in TamboProvider | ✅ Done | Via `TamboProviderWithAuth` component |

### Implementation (Complete)

```typescript
"use client";

import { TamboProvider } from "@tambo-ai/react";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function TamboLayout({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const supabase = createClient();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setAccessToken(session?.access_token);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setAccessToken(session?.access_token)
    );
    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <TamboProvider
      apiKey={process.env.NEXT_PUBLIC_TAMBO_API_KEY}
      userToken={accessToken}
      components={components}
      tools={tools}
    >
      {children}
    </TamboProvider>
  );
}
```

---

## 📋 Implementation Priority

### Phase 1: Core UX (Now)

- [x] Generative components
- [x] Local tools
- [x] Basic chat interface
- [x] **Supabase + Tambo auth integration**
- [x] **Streaming indicators**

### Phase 2: Real Data (Next)

- [ ] Connect Prometheus via custom MCP
- [ ] Connect GitHub via Tambo dashboard
- [ ] Replace mock data in tools

### Phase 3: Advanced Features (Future)

- [x] Interactable components
- [x] Suggested actions
- [x] Message history persistence
- [x] Model selection

---

## 🔗 Tambo Documentation References

| Topic                   | URL                                                                          |
| ----------------------- | ---------------------------------------------------------------------------- |
| Generative Components   | https://docs.tambo.co/concepts/generative-interfaces/generative-components   |
| Interactable Components | https://docs.tambo.co/concepts/generative-interfaces/interactable-components |
| Local Tools             | https://docs.tambo.co/concepts/tools/local-tools                             |
| MCP Integration         | https://docs.tambo.co/concepts/model-context-protocol                        |
| User Authentication     | https://docs.tambo.co/concepts/user-authentication                           |
| Supabase Guide          | https://docs.tambo.co/guides/add-authentication/supabase                     |
| Component State         | https://docs.tambo.co/concepts/generative-interfaces/component-state         |
| Streaming               | https://docs.tambo.co/concepts/streaming                                     |

---

_Last Updated: 2026-02-08_
