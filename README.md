# SRE Command Center 🛡️🚀

> **Autonomous Incident Response System // Neural-link Enabled // Multi-tool Orchestration**

![SRE Command Center Banner](public/grid.svg)

## 📖 Introduction

**SRE Command Center** is a futuristic, AI-driven dashboard designed for Site Reliability Engineers (SREs). It transforms standard monitoring into a high-octane, "Cyber-aesthetic" visual experience.

Moving beyond simple charts, this application integrates **Generative UI** concepts to provide real-time telemetry, automated root cause analysis, and interactive remediation tools in a single, immersive capability-based interface.

It is built to look and feel like a sci-fi "War Room" console, making the high-pressure job of incident management more intuitive and engaging.

## ✨ Key Features

### 1. 🖥️ Service Status Matrix (`ServiceStatusGrid`)

A real-time "Head-Up Display" (HUD) for your entire infrastructure.

- **Visual Health Indicators**: Instant color-coded status (Healthy, Degraded, Critical) with scanline animations.
- **Key Metrics**: Monitor Uptime, Latency, Error Rates, and RPS (Requests Per Second) at a glance.
- **Micro-interactions**: Hover effects and pulse animations to draw attention to failing nodes.

### 2. 🔥 Anomaly Heatmap (`AnomalyHeatmap`)

Detect patterns in the noise before they become outages.

- **Temporal Visualization**: View service health over specific time windows (4h, 8h, 24h).
- **Intensity Scoring**: Color gradients from Green (Normal) to Red (Critical) based on anomaly scores.
- **Detailed Tooltips**: Drill down into specific time slices to see exact anomaly percentages.

### 3. 🧠 AI Root Cause Analysis (`RootCauseAnalysis`)

Automated investigation assistant that connects symptoms to code.

- **Confidence Scoring**: AI assigns a probability percentage to its findings.
- **Evidence Collection**: Lists specific telemetry signals that led to the conclusion.
- **Code Correlation**: **USP Alert!** Directly links incidents to "Suspicious Code Changes" (git commits) that likely introduced the bug.
- **Recovery Plans**: Suggests actionable remediation steps (e.g., "Rollback to Sha: a1b2c3").

### 4. ⏱️ Unified Incident Timeline (`IncidentTimeline`)

The narrative of an outage, updated in real-time.

- **Event Feed**: Chronological log of alerts, automated actions, user notes, and resolutions.
- **Metric Drift Overlay**: Visualizes error rates directly alongside timeline events to correlate actions with results.
- **Role Attribution**: Clearly distinguishes between AI-generated events and human operator actions.

### 5. 💬 Delegated Chat Mode

- Interact with the system using natural language.
- Ask questions like "Why is the payments service slow?" or "Scale up the database cluster."

## 🎯 Use Cases

- **War Room Display**: Perfect for large monitors in an operations center to provide a shared context during critical incidents.
- **Proactive Monitoring**: Watch the Heatmap to identify "flaky" services that degrade periodically but don't trigger hard alerts.
- **Rapid Triage**: Use the AI Root Cause Analysis to skip the initial "what changed?" investigation phase and jump straight to fixing.
- **Post-Incident Reviews**: Use the Incident Timeline to reconstruct exactly what happened for post-mortem reports.

## 💎 Unique Selling Points (USP)

1.  **The "Cyber" Aesthetic**: Unlike sterile corporate dashboards, this app uses a "Dark Mode First", terminal-inspired design. It makes SRE work feel like piloting a spaceship, reducing fatigue and increasing engagement.
2.  **Context-Aware AI**: It doesn't just show graphs; it tells you _why_ the graph looks like that.
3.  **Code-to-Cloud Visibility**: Uniquely bridges the gap between infrastructure alerts and the specific application code (commits) that caused them.
4.  **Generative HUD**: The interface modules are designed to be dynamic, potentially composed on-the-fly based on the type of incident occurring.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm / yarn / pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/alokdangre/SRE-Command-Center.git
    ```
2.  Install dependencies:
    ```bash
    cd SRE-Command-Center
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + Custom Animations
- **Icons**: Lucide React
- **Validation**: Zod
- **Animation**: Framer Motion

---

_(C) 2026 TAMBO_AI // ENC_DEPT_BETA_
