# Hardware Integration Guide — TerraForge Nexus

This file explains how to connect TerraForge to real IoT hardware (sensors and actuators). TerraForge is simulation-first; the repository includes a minimal SSE gateway and a browser adapter that demonstrate the recommended, zero-dependency integration path.

## Overview

TerraForge uses a three-engine architecture:
- `DataEngine` — simulates sensors and stores values at `DataEngine.sensors`
- `WorkflowEngine` — evaluates triggers and executes actions
- `AnalyticsEngine` — analyzes historical and real-time data

For competition and zero-dependency operation we recommend two straightforward integration options:

- **SSE / WebSocket gateway (included):** Run `gateway/server.js` to accept `POST /publish` and stream events to connected browsers at `/events`.
- **HTTP / REST polling:** Poll device HTTP endpoints from a small node process or browser `fetch()` and map responses into `DataEngine.sensors`.

MQTT-based integrations are supported by the general pattern (gateway → browser), but a full MQTT bridge is not included in this repository to keep the project dependency-free. If you need MQTT support in production, run a small external broker (Mosquitto) and a lightweight bridge on your gateway device.

## Quick local gateway (zero-dependency)

Run the included SSE gateway and static server locally:

```bash
# Start SSE gateway (accepts POST /publish and pushes to connected browsers)
node gateway/server.js

# Start the local static server to serve the app at http://localhost:8080
node gateway/static.js
```

Publish a test sensor event (PowerShell example):

```powershell
Invoke-RestMethod -Uri 'http://localhost:9001/publish' -Method POST -Body (@{topic='terraforge/orchard-quad/soil-moisture'; value=35; unit='%'} | ConvertTo-Json) -ContentType 'application/json'
```

Browser adapter
- The repo contains `assets/js/adapter.js` which connects to the gateway (SSE/WebSocket) and maps `terraforge/<zone>/<sensor>` messages to `DataEngine.sensors` automatically.

Actuators
- When `WorkflowEngine.executeAction()` runs, have it POST to your gateway's actuator endpoint (HTTP POST). Keep commands idempotent and authenticated.

Security & production
- Run TLS (wss / https), require tokens/certs, rate-limit sensor inputs, and validate actuator requests.

Checklist to go from demo → real
- [ ] Provision local gateway (Pi) and secure it
- [ ] Configure sensors to publish to `terraforge/<zone>/<sensor>` or expose REST endpoints
- [ ] Map incoming messages to `DataEngine.sensors` (adapter demonstrates this)
- [ ] Implement actuator endpoints and secure them
- [ ] Test workflows with live sensor values and monitor `WorkflowEngine` logs

---

If you'd like, I can help set up a small Mosquitto + bridge on your gateway (separate optional script), but the repo itself remains package-free for the competition.