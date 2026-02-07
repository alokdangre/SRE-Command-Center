# SRE Command Center - User Guide

> **How to use SRE Command Center to manage incidents, monitor services, and automate remediation.**

---

## 🎯 What is SRE Command Center?

SRE Command Center is an AI-powered incident response platform that replaces the need to juggle multiple tools (Grafana, PagerDuty, Slack, GitHub, kubectl) during an outage. Instead, you interact with a single conversational interface that:

1. **Shows you what you need** - Ask questions and get dynamic visualizations
2. **Explains what's happening** - AI analyzes logs, metrics, and code changes
3. **Takes action on your behalf** - Execute rollbacks, scale services, notify teams
4. **Learns from incidents** - Store and analyze past incidents for patterns

---

## 🚀 Getting Started (For SRE Users)

### Step 1: Login

1. Navigate to `https://your-sre-command-center.com`
2. Click **"INITIATE_SESSION"**
3. Login with:
   - **Email/Password** - If your admin set up email auth
   - **GitHub** - One-click login with your GitHub account
   - **Google** - One-click login with your Google account

### Step 2: Connect Your Services

After login, you'll be prompted to connect your infrastructure tools. These connections allow the AI to fetch real data.

| Service        | What It Provides                                 | How to Connect                         |
| -------------- | ------------------------------------------------ | -------------------------------------- |
| **Prometheus** | Real-time metrics (CPU, memory, latency, errors) | Enter your Prometheus server URL       |
| **Kubernetes** | Pod health, deployments, rollbacks               | Upload kubeconfig or enter cluster URL |
| **GitHub**     | Commit history, PRs, code changes                | OAuth login to your GitHub org         |
| **Slack**      | Team discussions, incident channels              | OAuth login to your Slack workspace    |
| **PagerDuty**  | Alert history, on-call schedules                 | API key from PagerDuty                 |

> **Note**: Each connection is stored securely and scoped to your user account.

### Step 3: Enter the Command Center

Click **"INITIALIZE_COMMAND_CTR"** to enter the main dashboard.

---

## 💬 How to Use the AI Interface

The core of SRE Command Center is the **chat interface**. You ask questions or give commands in natural language, and the AI responds with:

1. **Text explanations** - Context about what's happening
2. **Dynamic visualizations** - Charts, timelines, heatmaps
3. **Actionable controls** - Buttons to execute remediations

### Example Queries

| What You Ask                               | What Happens                                               |
| ------------------------------------------ | ---------------------------------------------------------- |
| "Show me the system status"                | Displays a grid of all services with health indicators     |
| "What alerts are firing right now?"        | Shows a summary of active alerts by severity               |
| "Why is the notification service failing?" | AI analyzes metrics, commits, and Slack to give root cause |
| "Show me what happened in the last hour"   | Renders an incident timeline with events and metrics       |
| "What services had anomalies today?"       | Displays a heatmap of anomaly scores across time           |
| "Rollback the notification service"        | Shows remediation options with a confirmation button       |
| "Copy the incident summary"                | Copies formatted text to your clipboard                    |
| "Play an alert sound"                      | Plays an audible alert (for critical notifications)        |

---

## 🖥️ Understanding the Visualizations

### Service Status Grid

![Service Status Grid](docs/assets/service-grid.png)

- **Green border** = Healthy
- **Amber border** = Degraded (elevated errors or latency)
- **Red border** = Critical (failing health checks)

Each card shows:

- Uptime percentage
- Current latency (ms)
- Error rate (%)
- Requests per second (RPS)
- Version number

**When to use**: Start here to get a quick overview of system health.

---

### Anomaly Heatmap

![Anomaly Heatmap](docs/assets/heatmap.png)

A grid showing anomaly scores for each service across time windows.

- **Green cells** = Normal behavior
- **Yellow/Amber cells** = Unusual patterns detected
- **Red cells** = Significant anomalies

**When to use**: Identify recurring issues (e.g., "payments fail every day at 4 PM").

---

### Incident Timeline

![Incident Timeline](docs/assets/timeline.png)

A chronological view of:

- Alert triggers
- Automated actions (scaling, restarts)
- Human notes and acknowledgements
- Metric changes (error rate overlay)

**When to use**: During an active incident to track what's been done, or post-mortem to reconstruct events.

---

### Root Cause Analysis

![Root Cause Analysis](docs/assets/rca.png)

AI-generated analysis including:

- **Suspected Cause** - What the AI thinks is wrong
- **Confidence Score** - How sure the AI is (0-100%)
- **Evidence** - Specific signals that led to this conclusion
- **Suspicious Commits** - Code changes that correlate with the incident
- **Recommended Action** - What to do next

**When to use**: To accelerate the "what changed?" investigation phase.

---

## 🔧 Taking Action (Remediations)

When you ask the AI to fix something, it will show you available actions:

| Action                  | Risk Level | What It Does                          |
| ----------------------- | ---------- | ------------------------------------- |
| **Scale Horizontal**    | Low        | Add more pods to handle load          |
| **Restart Pods**        | Low        | Rolling restart of service pods       |
| **Enable Safe Mode**    | Low        | Disable non-essential features        |
| **Rollback Deployment** | Medium     | Revert to previous known-good version |
| **Traffic Shift**       | High       | Move traffic to another region        |

Each action shows:

- Estimated impact
- Step-by-step execution plan
- Confirmation button (you must click to execute)

> **Safety**: High-risk actions require explicit confirmation and are logged.

---

## 🔔 Notifications & Alerts

SRE Command Center can send you browser notifications:

1. **Ask the AI**: "Notify me if payment errors exceed 5%"
2. **Allow notifications** when prompted by your browser
3. You'll receive desktop alerts even if the tab is in the background

You can also:

- **Play alert sounds** for critical events
- **Export incident data** as JSON for external tools
- **Copy summaries** to paste into Slack or Jira

---

## 📊 Connecting Real Data Sources

### Prometheus Integration

To connect Prometheus:

1. Go to **Settings > Integrations**
2. Click **Add Prometheus**
3. Enter your Prometheus server URL (e.g., `http://prometheus.monitoring:9090`)
4. Click **Test Connection**
5. Click **Save**

Once connected, asking "show me CPU usage" will query live Prometheus data.

### GitHub Integration

To connect GitHub:

1. Go to **Settings > Integrations**
2. Click **Connect GitHub**
3. Authorize the SRE Command Center GitHub App
4. Select the repositories you want to analyze

Once connected, the AI can:

- List recent commits
- Identify breaking changes
- Link commits to incidents

### Kubernetes Integration

To connect Kubernetes:

1. Go to **Settings > Integrations**
2. Click **Add Kubernetes Cluster**
3. Either:
   - Upload your `kubeconfig` file, OR
   - Enter the cluster API URL + service account token
4. Click **Test Connection**
5. Click **Save**

Once connected, the AI can:

- List pod health
- Show deployment history
- Execute rollbacks and restarts

---

## 🧪 Testing Your Setup

After connecting your services, verify everything works:

### Test 1: Check System Overview

Ask: **"What's the current system status?"**

Expected: A `ServiceStatusGrid` should appear showing your real services.

### Test 2: Check Alerts

Ask: **"Are there any active alerts?"**

Expected: An `AlertSummary` should show alerts from your Prometheus/PagerDuty.

### Test 3: Check Commits

Ask: **"What code changed in the last 24 hours?"**

Expected: A list of commits from your connected GitHub repos.

### Test 4: Test Remediation

Ask: **"What remediation options are available for [service-name]?"**

Expected: A list of actions like rollback, scale, restart.

---

## 🤝 Team Collaboration

### Sharing Incidents

1. Ask: **"Copy the incident summary"**
2. Paste into Slack, Jira, or email

### Exporting Data

1. Ask: **"Export the incident data as JSON"**
2. A file will download with:
   - Timeline events
   - Metrics snapshots
   - Root cause analysis
   - Actions taken

### On-Call Handoff

Before ending your shift:

1. Ask: **"Summarize what happened today"**
2. Copy and share with the next on-call engineer

---

## ❓ Troubleshooting

### "No data available"

- Check that your integrations are connected in Settings
- Verify network access to Prometheus/Kubernetes from SRE Command Center

### "Action failed"

- Check your permissions (do you have access to the cluster?)
- Check the cluster's health (is the API server responsive?)

### "AI gave wrong answer"

- Be more specific in your question
- Ask: "Why did you conclude that?" to see the AI's reasoning

---

## 🔐 Security & Access

- All connections use TLS encryption
- OAuth tokens are stored encrypted in Supabase
- Actions are logged with user attribution
- Sensitive data (secrets, passwords) is never shown

---

_Last Updated: 2026-02-07_
