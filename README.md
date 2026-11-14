# CloudEagle.ai — AI Governance & Spend Command Center

[![Deployment Status](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](https://cloudeagle-ai-gov.vercel.app)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

**Live Production Prototype:** [https://cloudeagle-ai-gov.vercel.app](https://cloudeagle-ai-gov.vercel.app)

> **Product Reviewer Tip:** Toggle **"PM Rationale Pins"** in the top-right header to reveal interactive product management annotations (`#1`–`#5`) explaining *why* each visualization and workflow exists for the **CFO (FinOps)** and **CISO (IT/Security)** personas.

---

## Executive Product Overview

As enterprise teams adopt generative AI via hybrid seat + token APIs, corporate cards (Brex/Ramp), and self-serve Google Workspace OAuth grants, Finance and Security leaders face a visibility gap. This single-screen **AI Governance & Spend Command Center** unifies multi-signal discovery with closed-loop remediation:

1. **Executive 10-Second Scan (KPI Strip):** Reconciles net AI spend vs. approved budget caps (`$42,850 / $50,000`), Shadow AI exposure (`$6,420/mo` across unapproved tools), licensed seat utilization (`418 / 620` active seats with `$4,120/mo` reclaimable shelfware), and active policy breaches.
2. **Department Pacing & EOM Burn-Rate Forecast (60% / 40% Analytical Split):**
   - **Horizontal Bullet Chart:** Compares current department spend against approved caps and linear end-of-month run-rate projections (flagging Engineering's projected Nov 23 breach).
   - **Sanctioned vs. Shadow AI Split:** Contrasts governed stack spend against unsanctioned card/OAuth spend with explicit tool counts per department.
3. **2×2 Seat Efficiency Quadrant & Closed-Loop Action Queue:**
   - Plots **Active Seat Utilization % vs. Monthly Spend** using custom interactive SVG bubbles, isolating *Jasper AI* (`18%` utilization, `$4.9k/mo`) in the *Shelfware Risk* quadrant.
   - Pairs insights directly with 1-click workflows: **Adjust Spend Cap**, **Approve / Block OAuth App** (*Otter.ai*), and **Reclaim Inactive Licenses** (`$3,960/mo` harvested live).
4. **Multi-Signal AI Tool Inventory & Governance Ledger:** Correlates telemetry from **OpenAI/Anthropic/GitHub Admin APIs**, **Okta SSO**, **Google OAuth Logs**, and **Brex/Ramp Expense Feeds**, complete with a slide-over telemetry drawer inspecting OAuth scopes and LLM data-training policies.

---

## Tech Stack & Engineering Highlights

- **Framework:** React 18 + TypeScript + Vite + Tailwind CSS + `lucide-react`
- **Zero-Dependency Custom SVG Charts:** Responsive bullet charts, stacked columns, and 2×2 quadrant scatter plots with interactive hover tooltips and zero SSR/hydration overhead.
- **Modern Web Platform Standards:** Built with native `<dialog closedby="any">` modals (`showModal()`), top-layer scroll containment (`overscroll-behavior: contain`), WCAG 1.4.1 accessible tablists, and container-queried sticky data tables.

```bash
npm install
npm run dev      # Starts local server at http://localhost:5173
npm run build    # Runs strict TypeScript check (tsc -b) + production bundle
```
