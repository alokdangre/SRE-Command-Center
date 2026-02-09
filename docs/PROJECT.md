# SRE_CMD-CTR

## Inspiration

SREs usually have to jump between multiple tools during incidents: metrics dashboards, alerting systems, chat apps, deploy history, and cluster consoles. That context switching slows triage and recovery right when minutes matter most.  
SRE_CMD-CTR was inspired by the idea that incident response should feel like one coordinated control room, where AI can assist with both understanding what is happening and executing safe next steps.

## What it does

SRE_CMD-CTR is an AI-powered incident command center that combines observability, incident context, and remediation workflows in a single interface.

- Shows live system health, alerts, anomalies, and incident timelines
- Uses AI to generate root-cause analysis with evidence and confidence
- Connects to GitHub, Prometheus, PagerDuty, Slack, and Kubernetes
- Provides remediation recommendations and executable actions
- Supports persistent interactable UI panels that can update across a conversation
- Stores user integrations and conversation history per user account

## How we built it

We built SRE_CMD-CTR as a full-stack web app with an AI orchestration layer:

- Frontend:
  - Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion
- AI interaction model:
  - Tambo Provider with registered tools + generative components
  - Zod schemas for strict tool input/output and component props
- Authentication and persistence:
  - Supabase Auth (email/password + OAuth)
  - Supabase tables for integrations, preferences, incidents, and thread history
- Integration adapters:
  - Prometheus + Alertmanager for metrics/alerts
  - GitHub API for commits/PR/workflow context
  - PagerDuty for active incidents and timelines
  - Slack OAuth + conversation context
  - Kubernetes API for deployment/pod status and remediation actions
- Runtime behavior:
  - Route protection via middleware
  - Thread snapshot persistence
  - Runtime AI context sync (session, route, preferences, model selection)

## Built With

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Tambo AI (`@tambo-ai/react`, `@tambo-ai/typescript-sdk`)
- Supabase Auth + Supabase Postgres
- Zod
- Recharts
- Radix UI
- Lucide React
- Prometheus + Alertmanager
- GitHub API
- PagerDuty API
- Slack API
- Kubernetes API

## Challenges we ran into

- Normalizing outputs from very different provider APIs into a single AI-friendly shape
- Keeping remediation operations safe while still useful for real incidents
- Managing auth/session handoff cleanly between Supabase, OAuth callbacks, and AI runtime
- Making AI responses reliable by enforcing strict schemas and explicit error paths
- Handling integration-not-configured states without breaking user flow
- Balancing expressive cyber UI design with clarity under incident pressure

## Accomplishments that we're proud of

- Delivered a working Generative UI experience with domain-specific SRE components
- Implemented interactable components that AI can update over time
- Connected live integrations across five major operational systems
- Added guarded remediation capabilities instead of static read-only dashboards
- Built persistent thread history and per-user integration storage with RLS
- Completed the tracked Tambo feature checklist in the project docs

## What we learned

- Schema-first design is critical for trustworthy AI tool calling
- Explicit integration health/error messaging dramatically improves operator confidence
- AI-assisted UX works best when text responses are paired with structured visual components
- Safe operational controls need both technical guardrails and product-level clarity
- Persistent context (thread history + runtime state) is essential for incident continuity

## What's next for SRE_CMD-CTR

- Multi-repo and multi-cluster correlation for larger organizations
- Stronger remediation guardrails (approval steps, policy enforcement, audit traces)
- Automated post-incident reports with timeline + root-cause evidence packaging
- Predictive anomaly scoring and early warning suggestions
- Runbook-aware action plans tied to service ownership and incident severity
- Team collaboration upgrades for handoff workflows and shared incident notes
