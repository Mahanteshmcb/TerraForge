TerraForge Nexus — Competition Pitch & ROI Checklist

Elevator Pitch (60s)
--------------------
TerraForge Nexus is a zero-dependency, browser-native command center for autonomous campuses and smart agriculture. It delivers real-time telemetry, automated workflows, and actionable analytics without external libraries — making deployment fast, secure, and cost-effective. Judges: show how alerts trigger automations, how the dashboard visualizes impact, and how a single click reduces manual intervention and operational cost.

Why judges will like it
-----------------------
- Real product fit: solves irrigation, energy, and facility automation problems.
- Zero-dependency architecture: simple to deploy and audit — ideal for resource-constrained environments.
- Clear metrics: efficiency, alerts reduced, energy saved, and maintenance calls avoided.
- Polished UI/UX: accessible, responsive, and production-ready visuals.

3-minute demo script
--------------------
1. 00:00–00:30 — Landing: show loading screen, theme toggle, and responsive layout.
2. 00:30–01:15 — Telemetry: click Orchard Quad; explain sensors and live metrics.
3. 01:15–02:00 — Automation: run the Demo; show alert → irrigation automation → log entries.
4. 02:00–02:30 — Analytics: open Health & Efficiency reports; point out ROI numbers.
5. 02:30–03:00 — Deployment: show `node gateway/static.js` + `node gateway/server.js` + publish example; emphasize no external packages.

Judging highlights (what to call out)
-------------------------------------
- Technical: vanilla JS, no dependencies, SSE gateway, modular engines (Data/Workflow/Analytics).
- UX: accessibility, responsive design, polished micro-interactions.
- Impact: clear automation flows, real-time observability, and low deployment cost.

ROI Checklist (one pager)
-------------------------
- Problem: Manual irrigation and monitoring costs labor and water.
- Solution: Automated detection + irrigation reduces manual labor and optimizes water use.
- Metrics to present:
  - Water saved per day (L) — estimate from irrigation duration and flow rate.
  - Labor hours avoided per week — show workflow automation frequency.
  - Energy saved (%) — via facility efficiency improvements.
  - Estimated monthly savings (INR) — conservative scenario and optimistic scenario.

Simple ROI example (conservative)
- Water saved: 200 L/day → 6,000 L/month
- Labor saved: 1 hour/day @ ₹200/hour → ₹6,000/month
- Energy saving: small site optimization → ₹2,000/month
- Total estimated monthly savings: ₹14,000 → payback in weeks for small farm hardware costs.

Deliverables for judges
----------------------
- Live URL (Vercel) + GitHub repo (public)
- Demo steps (commands) and run checklist
- Short video (30–60s) showing alert→automation flow (optional)

Demo run checklist (copyable)
```bash
# Start gateway and static server
node gateway/server.js
node gateway/static.js
# Publish sample event
curl -X POST http://localhost:9001/publish -H "Content-Type: application/json" -d '{"topic":"terraforge/orchard-quad/soil-moisture","value":25,"unit":"%"}'
```

Notes for submission
--------------------
- Ensure repository is public and README contains the demo checklist.
- Prepare a 3-minute script and rehearse the Demo steps until smooth.
- Bring a short 30s screencast as a backup if live demo connectivity is uncertain.

Contact
-------
Built by the TerraForge team — ready for Q&A and live walkthrough.
