SSE Gateway (No Packages)

This lightweight gateway demonstrates how to feed real device data into TerraForge without using any external packages.

Run locally:

```bash
node gateway/server.js
```

Publish a sample sensor value (curl):

```bash
curl -X POST http://localhost:9001/publish \
  -H "Content-Type: application/json" \
  -d '{ "topic": "terraforge/orchard-quad/soil-moisture", "value": 42, "unit": "%" }'
```

TerraForge browser adapter (`assets/js/adapter.js`) listens to `http://localhost:9001/events` by default and will update `DataEngine.sensors` when messages arrive.

This gateway is intentionally minimal and uses only Node's built-in `http` module to avoid external dependencies, per competition rules.