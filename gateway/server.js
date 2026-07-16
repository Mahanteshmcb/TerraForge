// Simple SSE gateway (no external packages)
// Usage: node server.js

const http = require('http');
const port = process.env.PORT || 9001;

let clients = [];

function sendSSE(res, data) {
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

const server = http.createServer((req, res) => {
  if (req.url === '/events' && req.method === 'GET') {
    // SSE endpoint
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    res.write('\n');
    const clientId = Date.now();
    const client = { id: clientId, res };
    clients.push(client);

    req.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
    });

    return;
  }

  if (req.url === '/publish' && req.method === 'POST') {
    // Receive JSON payload: { topic: 'terraforge/<zone>/<sensor>', value: 42 }
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        // Broadcast to all SSE clients
        clients.forEach(c => sendSSE(c.res, payload));
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ ok: false, error: 'invalid-json' }));
      }
    });

    return;
  }

  // Allow OPTIONS for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Fallback
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

// Heartbeat to keep connections alive
setInterval(() => {
  const hb = { topic: 'terraforge/_heartbeat', value: Date.now() };
  clients.forEach(c => sendSSE(c.res, hb));
}, 15000);

server.listen(port, () => console.log(`SSE Gateway listening on http://localhost:${port}`));
