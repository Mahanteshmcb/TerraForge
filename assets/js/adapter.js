// Browser adapter to receive SSE from local gateway (no packages)
// Default URL: http://localhost:9001/events

(function () {
  const sseUrl = window.TERRAF_HOST_SSE || (location.hostname === 'localhost' ? 'http://localhost:9001/events' : '/events');

  function connect() {
    try {
      const es = new EventSource(sseUrl);
      es.onopen = () => console.log('Adapter: connected to SSE gateway', sseUrl);
      es.onerror = (e) => console.warn('Adapter: SSE error', e);
      es.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          // Expecting { topic: 'terraforge/<zone>/<sensor>', value, unit }
          if (!msg.topic) return;

          const parts = msg.topic.split('/');
          // handle heartbeat
          if (parts[1] === '_heartbeat') return;

          const zone = parts[1];
          const sensor = parts[2];
          const value = msg.value;
          const unit = msg.unit || '';

          window.DataEngine = window.DataEngine || { sensors: {}, alerts: [] };
          window.DataEngine.sensors[zone] = window.DataEngine.sensors[zone] || {};
          window.DataEngine.sensors[zone][sensor] = {
            value: value,
            unit: unit,
            timestamp: Date.now(),
            status: 'ok',
            trend: 'stable'
          };

        } catch (err) {
          console.error('Adapter: invalid SSE payload', err);
        }
      };
    } catch (err) {
      console.error('Adapter: failed to connect to SSE gateway', sseUrl, err);
    }
  }

  // Expose connector and auto-connect in local dev
  window.TerraForgeAdapter = { connect };
  if (location.hostname === 'localhost') connect();
})();
