# SRE Command Center - Manual Test User Flows

> Complete manual QA flows for every feature listed in `docs/TAMBO_CHECKLIST.md`.

---

## 1. Test Setup

1. Start app:
   - `npm install`
   - `npm run dev`
2. Open `http://localhost:3000`.
3. Create two accounts for auth isolation tests:
   - `qa_user_a`
   - `qa_user_b`
4. Keep browser DevTools open for:
   - `Application > Local Storage`
   - `Network` (filter requests containing `threads` or `tambo`).
5. Optional real integration credentials:
   - GitHub PAT or OAuth app
   - Prometheus URL
   - PagerDuty API key
   - Slack OAuth env (`SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`)
   - Kubernetes cluster URL + service account token

Notes:
- If an integration is not configured, tools must return empty/live-safe responses with explicit integration errors (no mock data).
- For tool tests, if AI does not call a tool on first try, repeat prompt and explicitly say `Use tool <tool_name>`.

---

## 2. Authentication (1)

### AUTH-01 `userToken` in `TamboProvider`
Route: `/settings`, `/sre`

Preconditions:
- Both test users exist.

Steps:
1. Login as `qa_user_a`.
2. Connect at least one integration in Settings (for example GitHub or Prometheus).
3. Go to `/sre`, send a message.
4. Logout.
5. Login as `qa_user_b`.
6. Open Settings and check integrations.

Expected:
- `qa_user_b` does not inherit `qa_user_a` integrations.
- Per-user data is isolated.

---

## 3. Integrations (5)

### INT-01 GitHub Integration
Route: `/settings`

Steps:
1. Open Settings.
2. Click GitHub `CONNECT`.
3. Use OAuth or PAT flow.
4. Save.
5. Ask in `/sre`: `Use tool analyzeRecentCommits for last 24 hours.`

Expected:
- GitHub shows `Connected`.
- Tool returns real commits only from configured repositories.

### INT-02 Prometheus Integration
Route: `/settings`

Steps:
1. Open Settings.
2. Click Prometheus `CONNECT`.
3. Enter URL (+ optional auth), save.
4. Ask in `/sre`: `Use tool getHealthMetrics.`

Expected:
- Prometheus shows `Connected`.
- Health metrics are returned.

### INT-03 PagerDuty Integration
Route: `/settings`

Steps:
1. Open Settings.
2. Click PagerDuty `CONNECT`.
3. Enter API key and optional service IDs.
4. Save.
5. Ask in `/sre`: `Use tool getCurrentIncident.`

Expected:
- PagerDuty shows `Connected`.
- Incident data is returned.

### INT-04 Slack Integration
Route: `/settings`, `/auth/slack/start`

Steps:
1. Ensure server has `SLACK_CLIENT_ID` and `SLACK_CLIENT_SECRET`.
2. Open Settings and click Slack `CONNECT`.
3. Complete OAuth install flow.
4. Return to app and verify connected status.
5. Ask in `/sre`: `Use tool getSlackContext.`

Expected:
- Slack shows `Connected`.
- Context is returned from live Slack data, or a clear integration/data error is returned.

### INT-05 Kubernetes Integration + Security Hardening
Route: `/settings`

Steps:
1. Open Settings and start Kubernetes connect flow.
2. Enter `http://example.com` as cluster URL and valid-looking token.
3. Click `CONNECT`.
4. Confirm error blocks insecure non-local HTTP URL.
5. Enter valid HTTPS cluster URL, token, default namespace, and allowed namespaces.
6. (Optional) Enable `skip_tls_verify`; verify it is accepted only for localhost.
7. Save.

Expected:
- Invalid URL/security configs are rejected with clear message.
- Valid secure config is accepted.
- Namespace allowlist and default namespace are enforced in verification.

---

## 4. Core Features (11)

### CORE-01 `TamboProvider`
Route: `/sre`

Steps:
1. Open `/sre`.
2. Send a normal chat message.

Expected:
- No provider/runtime error.
- Chat and tools function.

### CORE-02 `useTamboThread`
Route: `/chat`

Steps:
1. Open `/chat`.
2. Send 2 messages in same thread.
3. Refresh page.

Expected:
- Thread remains accessible.
- Messages are still shown in the thread context.

### CORE-03 `useTamboThreadInput`
Route: `/chat` or `/sre`

Steps:
1. Type text in input box.
2. Add image (if testing image path).
3. Submit.

Expected:
- Input sends message correctly.
- Input state resets after successful submit.

### CORE-04 Components Registration
Route: `/sre`

Steps:
1. Send prompt: `Render AlertSummary and IncidentTimeline for current incident.`

Expected:
- Registered Tambo components render in chat response.

### CORE-05 Tools Registration
Route: `/sre`

Steps:
1. Send prompt: `Use tool getSystemOverview and show result.`

Expected:
- Tool executes successfully.

### CORE-06 Streaming Support
Route: `/sre`

Steps:
1. Send a complex prompt requiring multiple outputs.

Expected:
- Streaming/typing/stage indicators appear while response is generated.

### CORE-07 `useTamboState`
Route: `/sre`

Steps:
1. Open `/sre`.
2. Toggle chat panel open/close once.
3. Send one message.
4. In DevTools Local Storage, inspect key `sre.tambo.runtime-state.v1`.

Expected:
- Runtime state key exists and updates (`chatPanelOpen`, route, incidentId).

### CORE-08 `useTamboContext`
Route: `/sre`

Steps:
1. Open `/sre`.
2. Send message.
3. In DevTools Network, inspect request payload.

Expected:
- Additional context includes `userPreferences` and `sreSession`.

### CORE-09 Suggested Actions
Route: `/sre`

Steps:
1. Wait for suggested action buttons under chat thread.
2. Click one suggested action.

Expected:
- Button click sends message quickly.
- New AI response appears.

### CORE-10 Message History Persistence
Route: `/sre`, database

Steps:
1. Send 3+ messages in `/sre`.
2. Wait 2-3 seconds after each message.
3. Verify rows in `thread_history` table for current user/thread.

Expected:
- Thread snapshots are persisted to Supabase.

### CORE-11 Model Selection
Route: `/settings`, `/sre`

Steps:
1. Open Settings.
2. Change provider/model and click `Save Model Preference`.
3. Open `/sre`, send message.
4. Inspect request payload in DevTools.

Expected:
- Model selection saved to local storage.
- Message request contains model selection context.

---

## 5. Generative Components (6)

Common execution for GEN tests:
1. Open `/sre`.
2. Paste the prompt exactly.
3. Press Enter.
4. Wait for rendering to complete.

### GEN-01 `ServiceStatusGrid`
Prompt:
`Render ServiceStatusGrid for checkout-api, notifications, and payments with health metrics.`

Expected:
- Grid shows service cards with statuses/metrics.

### GEN-02 `AnomalyHeatmap`
Prompt:
`Render AnomalyHeatmap for 24h anomalies by service and severity.`

Expected:
- Heatmap component appears with anomaly intensity view.

### GEN-03 `IncidentTimeline`
Prompt:
`Render IncidentTimeline for the active incident with at least 5 events.`

Expected:
- Chronological timeline appears.

### GEN-04 `RootCauseAnalysis`
Prompt:
`Render RootCauseAnalysis using alerts, commits, and incident evidence.`

Expected:
- RCA component with cause/evidence/recommendations appears.

### GEN-05 `AlertSummary`
Prompt:
`Render AlertSummary grouped by severity for current alerts.`

Expected:
- Alert summary grouped by severity appears.

### GEN-06 `Graph`
Prompt:
`Render Graph of latency and error rate for last 60 minutes.`

Expected:
- Graph component renders chart data.

---

## 6. Interactable Components (3)

### INTC-01 `ServiceCard` (interactable)
Route: `/sre`

Steps:
1. Send prompt:
   `Create interactable ServiceCard for checkout-api with id svc-checkout and status healthy.`
2. Send follow-up:
   `Update svc-checkout status to degraded and latency to 1200ms.`

Expected:
- Same interactable card updates instead of creating unrelated duplicates.

### INTC-02 `IncidentNotes` (interactable)
Route: `/sre`

Steps:
1. Send prompt to create notes panel for incident `inc-2024-001`.
2. Send follow-up to append new note and next step.

Expected:
- Notes panel updates with new entry while preserving existing notes.

### INTC-03 `RemediationPanel` (interactable)
Route: `/sre`

Steps:
1. Ensure remediation panel is visible.
2. Send prompt to update recommendation/action states.

Expected:
- Panel updates in-place with changed action/recommendation state.

---

## 7. Local Tools (8)

Common execution for LT tests:
1. Open `/sre`.
2. Paste the prompt exactly (include tool name).
3. Press Enter.
4. Validate both tool response text and browser side effect.

### LT-01 `flushLocalCache`
Prompt:
`Use tool flushLocalCache now.`

Expected:
- Tool returns success.
- Local/session storage is cleared.

### LT-02 `restartSession`
Prompt:
`Use tool restartSession now.`

Expected:
- Tool returns restart message.
- Page reloads shortly.

### LT-03 `copyToClipboard`
Prompt:
`Use tool copyToClipboard with text "SRE copy test".`

Expected:
- Tool success response.
- Paste operation shows copied text.

### LT-04 `getBrowserPerformance`
Prompt:
`Use tool getBrowserPerformance and summarize output.`

Expected:
- Timing (and optionally memory/network) values returned.

### LT-05 `sendBrowserNotification`
Prompt:
`Use tool sendBrowserNotification with title "SRE Test" and body "Notification path test".`

Expected:
- Permission prompt (first run) then browser notification.

### LT-06 `exportIncidentData`
Prompt:
`Use tool exportIncidentData with JSON {"incident":"qa","status":"ok"} and filename "qa-incident.json".`

Expected:
- JSON file download starts.

### LT-07 `playAlertSound`
Prompt:
`Use tool playAlertSound with type critical.`

Expected:
- Audible alert tone is played.

### LT-08 `getTimezoneInfo`
Prompt:
`Use tool getTimezoneInfo.`

Expected:
- Timezone, offset, and current time returned.

---

## 8. Backend Tools (13)

Common execution for BT tests:
1. Open `/sre`.
2. Paste the prompt exactly (include tool name).
3. Press Enter.
4. Confirm response payload content and no runtime error.

### BT-01 `getSystemOverview`
Prompt:
`Use tool getSystemOverview.`

Expected:
- Overall status and service/alert counts returned.

### BT-02 `getServiceStatus`
Prompt:
`Use tool getServiceStatus for checkout service.`

Expected:
- Service-level status details returned.

### BT-03 `getActiveAlerts`
Prompt:
`Use tool getActiveAlerts filtered by severity critical.`

Expected:
- Critical alerts list returned.

### BT-04 `analyzeRecentCommits`
Prompt:
`Use tool analyzeRecentCommits for last 24 hours.`

Expected:
- Commit risk/change summary returned.

### BT-05 `getCurrentIncident`
Prompt:
`Use tool getCurrentIncident.`

Expected:
- Active incident details returned.

### BT-06 `getIncidentTimelineData`
Prompt:
`Use tool getIncidentTimelineData for incident inc-2024-001.`

Expected:
- Timeline entries returned.

### BT-07 `getHealthMetrics`
Prompt:
`Use tool getHealthMetrics.`

Expected:
- CPU/memory/latency/error metrics returned.

### BT-08 `getRemediationOptions`
Prompt:
`Use tool getRemediationOptions with riskLevel low.`

Expected:
- Action list returned with risk/type/steps.

### BT-09 `executeRemediation`
Prompt:
`Use tool executeRemediation with an actionId from getRemediationOptions.`

Expected:
- If guardrails disabled: clear blocked message.
- If enabled and configured: success message with rollout steps.

### BT-10 `getSlackContext`
Prompt:
`Use tool getSlackContext for incident channel.`

Expected:
- Team message context summary returned.

### BT-11 `getRootCauseAnalysis`
Prompt:
`Use tool getRootCauseAnalysis.`

Expected:
- Aggregated RCA with evidence/recommendations returned.

### BT-12 `getAnomalyHeatmapData`
Prompt:
`Use tool getAnomalyHeatmapData for last 24h.`

Expected:
- Heatmap-ready anomaly dataset returned.

### BT-13 `getIntegrations`
Prompt:
`Use tool getIntegrations.`

Expected:
- Connected/disconnected integration status returned.

---

## 9. Coverage Matrix (Checklist -> Test Case)

| Checklist Feature | Test ID |
| --- | --- |
| `userToken` in TamboProvider | AUTH-01 |
| GitHub integration | INT-01 |
| Prometheus integration | INT-02 |
| PagerDuty integration | INT-03 |
| Slack integration | INT-04 |
| Kubernetes integration hardening | INT-05 |
| `TamboProvider` | CORE-01 |
| `useTamboThread` | CORE-02 |
| `useTamboThreadInput` | CORE-03 |
| Components registration | CORE-04 |
| Tools registration | CORE-05 |
| Streaming support | CORE-06 |
| `useTamboState` | CORE-07 |
| `useTamboContext` | CORE-08 |
| Suggested actions | CORE-09 |
| Message history | CORE-10 |
| Model selection | CORE-11 |
| `ServiceStatusGrid` | GEN-01 |
| `AnomalyHeatmap` | GEN-02 |
| `IncidentTimeline` | GEN-03 |
| `RootCauseAnalysis` | GEN-04 |
| `AlertSummary` | GEN-05 |
| `Graph` | GEN-06 |
| `ServiceCard` interactable | INTC-01 |
| `IncidentNotes` interactable | INTC-02 |
| `RemediationPanel` interactable | INTC-03 |
| `flushLocalCache` | LT-01 |
| `restartSession` | LT-02 |
| `copyToClipboard` | LT-03 |
| `getBrowserPerformance` | LT-04 |
| `sendBrowserNotification` | LT-05 |
| `exportIncidentData` | LT-06 |
| `playAlertSound` | LT-07 |
| `getTimezoneInfo` | LT-08 |
| `getSystemOverview` | BT-01 |
| `getServiceStatus` | BT-02 |
| `getActiveAlerts` | BT-03 |
| `analyzeRecentCommits` | BT-04 |
| `getCurrentIncident` | BT-05 |
| `getIncidentTimelineData` | BT-06 |
| `getHealthMetrics` | BT-07 |
| `getRemediationOptions` | BT-08 |
| `executeRemediation` | BT-09 |
| `getSlackContext` | BT-10 |
| `getRootCauseAnalysis` | BT-11 |
| `getAnomalyHeatmapData` | BT-12 |
| `getIntegrations` | BT-13 |

---

Last Updated: 2026-02-08
