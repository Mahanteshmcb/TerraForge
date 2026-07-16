# Hardware Integration Guide — TerraForge Nexus

This file explains how to connect TerraForge to real IoT hardware (sensors and actuators). The project is intentionally simulation-first, but the architecture allows straightforward real-device integration.

## 1) Overview

TerraForge uses a three-engine architecture:
- `DataEngine` — currently simulates sensors and stores values at `DataEngine.sensors`
- `WorkflowEngine` — evaluates triggers and executes actions
- `AnalyticsEngine` — analyzes historical and real-time data

To integrate real devices, replace or augment the simulation in `DataEngine` with adapters that fetch real sensor values (MQTT, HTTP, WebSocket, BLE).

## 2) Protocol Options (choose one)

- MQTT (recommended for many sensors)
  - Lightweight, persistent, works well with unstable networks
  - Broker examples: Mosquitto, HiveMQ, AWS IoT

- HTTP / REST
  - Simple polling via `fetch()` from devices that expose REST endpoints

- WebSocket
  - Use for real-time push from gateways

- BLE / Serial
  - For local USB-connected devices use serial adapters (Node bridge) or Web Bluetooth

## 3) Example: MQTT Adapter (Browser via Broker bridge)

Most browsers cannot connect directly to MQTT over raw TCP, but you can use an MQTT-over-WebSocket broker (Mosquitto supports this).

1) Setup Mosquitto with WebSocket support (example config omitted)
2) Use `mqtt.js` on a small server or edge gateway to bridge to the browser, or use `Paho MQTT` in-browser client.

Adapter example (Node/edge gateway — recommended):

```js
// gateway.js (runs on local machine or Raspberry Pi)
const mqtt = require('mqtt');
const WebSocket = require('ws');

const client = mqtt.connect('mqtt://broker.local');
const wss = new WebSocket.Server({ port: 9001 });

client.on('connect', () => {
  client.subscribe('terraforge/#');
});

client.on('message', (topic, message) => {
  // Broadcast to connected browser clients
  wss.clients.forEach(ws => ws.send(JSON.stringify({ topic, payload: message.toString() })));
});
```

In the browser (TerraForge), subscribe to the gateway WebSocket and update `DataEngine.sensors`:

```js
const ws = new WebSocket('ws://localhost:9001');
ws.addEventListener('message', (evt) => {
  const msg = JSON.parse(evt.data);
  // topic: terraforge/orchard-quad/soil-moisture
  const parts = msg.topic.split('/');
  const zone = parts[1];
  const sensor = parts[2];
  const value = parseFloat(msg.payload);

  DataEngine.sensors[zone] = DataEngine.sensors[zone] || {};
  DataEngine.sensors[zone][sensor] = { value, unit: '%', timestamp: Date.now(), status: 'ok' };
});
```

## 4) Example: Polling REST Device

```js
async function pollDevice(zone, sensor, url) {
  try {
    const res = await fetch(url);
    const json = await res.json();
    const value = json.value;
    DataEngine.sensors[zone] = DataEngine.sensors[zone] || {};
    DataEngine.sensors[zone][sensor] = { value, unit: json.unit || '', timestamp: Date.now(), status: 'ok' };
  } catch (e) { console.error(e); }
}

setInterval(() => pollDevice('lab-center','temperature','http://device.local/temperature'), 5000);
```

## 5) Actuator Control

When a workflow executes an action (e.g., `start-irrigation`), you should have the `WorkflowEngine.executeAction()` call send a command to the actuator bridge (via MQTT publish or HTTP POST):

```js
// Example: publish MQTT command
gatewayClient.publish('terraforge/actuators/irrigation', JSON.stringify({ zone: 'orchard-quad', action: 'start', duration: 30 }));
```

Or via REST to a gateway:

```js
fetch('http://gateway.local/actuators/irrigation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ zone: 'orchard-quad', action: 'start', duration: 30 })
});
```

## 6) Security & Production Considerations

- Use TLS for MQTT/WebSocket/HTTP.
- Authenticate devices (certs, tokens).
- Rate-limit sensor updates.
- Implement retries & idempotency for actuator commands.

## 7) Mapping to `DataEngine`

- The simplest approach: implement a `DataEngine.connectAdapter(adapter)` method that registers callbacks to update `DataEngine.sensors` and `DataEngine.history`.
- Keep the simulation layer as a fallback when no hardware is present.

## 8) Quick Checklist to Go From Demo → Real

- [ ] Provision a local gateway (Raspberry Pi) with MQTT and WebSocket bridge
- [ ] Configure sensors to publish to `terraforge/<zone>/<sensor>` topics
- [ ] Implement gateway listener (Node) to bridge messages to browser or server
- [ ] Map incoming messages to `DataEngine.sensors`
- [ ] Implement actuator endpoints and secure them
- [ ] Test workflows in `WorkflowEngine` with actual sensor values

---

If you want, I can scaffold a small Node gateway example (MQTT → WebSocket) and a simple `adapter.js` to run in the browser to connect to the gateway and begin feeding TerraForge real data. Say the word and I'll scaffold it now.