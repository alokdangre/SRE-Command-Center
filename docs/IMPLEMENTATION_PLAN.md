# SRE Command Center - Implementation Plan

> **Comprehensive plan covering all remaining TODOs from TAMBO_CHECKLIST.md**

---

## 📊 Current Status Summary

### Completed ✅

- Generative Components (5/5)
- Local Tools (8/8)
- User Authentication (1/1)
- GitHub Integration (Settings UI + API)
- Prometheus Integration (Settings UI + API)

### Remaining Work 🔴

---

## Phase 1: Connect Backend Tools to Real Integrations

**Status: IN PROGRESS**

The integrations are built, but the checklist shows tools as "Mock" - update checklist and verify integration paths.

| Tool                      | Target Integration | Status                                |
| ------------------------- | ------------------ | ------------------------------------- |
| `getSystemOverview`       | Prometheus         | ✅ Connected (needs checklist update) |
| `getServiceStatus`        | Prometheus         | ✅ Connected (needs checklist update) |
| `getActiveAlerts`         | Alertmanager       | ✅ Connected (needs checklist update) |
| `getHealthMetrics`        | Prometheus         | ✅ Connected (needs checklist update) |
| `analyzeRecentCommits`    | GitHub             | ✅ Connected (needs checklist update) |
| `getCurrentIncident`      | PagerDuty          | ⬜ TODO                               |
| `getIncidentTimelineData` | PagerDuty          | ⬜ TODO                               |
| `getRemediationOptions`   | Kubernetes         | ⬜ TODO                               |
| `executeRemediation`      | Kubernetes         | ⬜ TODO                               |
| `getSlackContext`         | Slack              | ⬜ TODO                               |
| `getRootCauseAnalysis`    | AI Enhanced        | ⬜ TODO                               |
| `getAnomalyHeatmapData`   | ML/Prometheus      | ⬜ TODO                               |

---

## Phase 2: Implement Remaining Integrations

### 2.1 PagerDuty Integration

**Purpose**: Incident management and on-call data

**Settings UI Fields**:

- API Key (service account)
- Service IDs to monitor
- Default escalation policy

**Functions to Implement**:

```typescript
// src/lib/integrations/pagerduty.ts
export async function getCurrentIncidents();
export async function getIncidentTimeline(incidentId: string);
export async function getOnCallSchedule();
export async function acknowledgeIncident(incidentId: string);
export async function resolveIncident(incidentId: string);
```

**Tools to Connect**:

- `getCurrentIncident` → `getCurrentIncidents()`
- `getIncidentTimelineData` → `getIncidentTimeline()`

---

### 2.2 Slack Integration

**Purpose**: Team context and discussions

**Settings UI Fields**:

- OAuth flow (Slack App install)
- Default channel selection
- Channels to monitor

**Functions to Implement**:

```typescript
// src/lib/integrations/slack.ts
export async function getChannelMessages(
  channel: string,
  options?: { since?: Date; limit?: number },
);
export async function searchMessages(query: string);
export async function getThreadContext(channelId: string, threadTs: string);
export async function postMessage(channel: string, text: string);
```

**Tools to Connect**:

- `getSlackContext` → `getChannelMessages()`

---

### 2.3 Kubernetes Integration

**Purpose**: Pod management and remediation

**Settings UI Fields**:

- Kubeconfig upload or inline config
- Default namespace
- Allowed namespaces (for security)

**Functions to Implement**:

```typescript
// src/lib/integrations/kubernetes.ts
export async function getPodStatus(namespace?: string);
export async function getDeployments(namespace?: string);
export async function restartDeployment(name: string, namespace: string);
export async function scaleDeployment(
  name: string,
  namespace: string,
  replicas: number,
);
export async function rollbackDeployment(name: string, namespace: string);
export async function getPodLogs(podName: string, namespace: string);
```

**Tools to Connect**:

- `getRemediationOptions` → List available actions based on cluster state
- `executeRemediation` → Run specific remediation (restart, scale, rollback)

---

### 2.4 Enhanced AI Root Cause Analysis

**Purpose**: Better AI-powered analysis using real data

**Implementation**:

- Collect data from all integrations
- Format context for Tambo AI
- Use multi-step reasoning for root cause

**Updates Needed**:

- `getRootCauseAnalysis` → Aggregate data from GitHub, Prometheus, Slack, PagerDuty

---

### 2.5 Anomaly Detection (ML/Prometheus)

**Purpose**: Detect unusual patterns in metrics

**Implementation Options**:

1. **Prometheus Recording Rules**: Pre-compute anomaly scores
2. **Client-side calculation**: Z-score analysis on historical data
3. **External ML service**: Dedicated anomaly detection API

**Tools to Connect**:

- `getAnomalyHeatmapData` → Calculate anomaly scores from Prometheus range queries

---

## Phase 3: Interactable Components

| Component                      | Description                               | Priority |
| ------------------------------ | ----------------------------------------- | -------- |
| `InteractableServiceCard`      | AI can update service status in real-time | High     |
| `InteractableRemediationPanel` | Shows ongoing remediation actions         | Medium   |
| `InteractableIncidentNotes`    | Collaborative notes during incident       | Low      |

**Implementation Pattern**:

```typescript
import { withInteractable } from "@tambo-ai/react";

export const InteractableServiceCard = withInteractable(ServiceCard, {
  componentName: "ServiceCard",
  propsSchema: serviceCardSchema,
});
```

---

## Phase 4: Core Tambo Features

| Feature           | Description                              | Priority |
| ----------------- | ---------------------------------------- | -------- |
| Streaming support | Show typing indicators, stream responses | High     |
| Suggested actions | Generate quick action buttons            | High     |
| Message history   | Persist conversations to Supabase        | Medium   |
| `useTamboState`   | AI-integrated state management           | Medium   |
| `useTamboContext` | Pass user preferences to AI              | Low      |
| Model selection   | Switch between AI providers              | Low      |

---

## Implementation Order

### Sprint 1 (Current)

1. ✅ Update TAMBO_CHECKLIST to reflect completed integrations
2. 🔄 Implement PagerDuty integration
3. 🔄 Connect `getCurrentIncident` and `getIncidentTimelineData`

### Sprint 2

4. Implement Slack integration (OAuth flow)
5. Connect `getSlackContext`
6. Implement Kubernetes integration basics

### Sprint 3

7. Implement `executeRemediation` for Kubernetes
8. Enhance `getRootCauseAnalysis` with real data aggregation
9. Implement anomaly score calculation for `getAnomalyHeatmapData`

### Sprint 4

10. Add Interactable Components
11. Implement streaming support
12. Add suggested actions

### Sprint 5

13. Message history persistence
14. Model selection
15. Final polish and testing

---

## Files to Create/Modify

### New Files

- `src/lib/integrations/pagerduty.ts` - PagerDuty API integration
- `src/lib/integrations/slack.ts` - Slack API integration
- `src/lib/integrations/kubernetes.ts` - Kubernetes API integration

### Modify

- `src/lib/integrations/config.ts` - Add PagerDuty, Slack, K8s configs
- `src/lib/integrations/index.ts` - Export new integrations
- `src/services/sre-tools.ts` - Connect remaining tools
- `src/services/integration-service.ts` - Add verification for new integrations
- `src/app/settings/page.tsx` - Add setup forms for new integrations
- `src/types/integrations.ts` - Add types for new integrations
- `docs/TAMBO_CHECKLIST.md` - Update status of all items

---

## Next Action

Starting with **Phase 1**: Update the TAMBO_CHECKLIST to reflect that GitHub and Prometheus integrations ARE connected (not just mock), then implement **PagerDuty integration**.
