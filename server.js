const WebSocket = require('ws');
const ping = require('ping');
const fs = require('fs');

const PORT = 8080;
let targets = JSON.parse(fs.readFileSync('targets.json', 'utf8'));
let config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
let lastStatus = {}; // guarda o status anterior

// Inicia o WebSocket
const wss = new WebSocket.Server({ port: PORT }, () => {
  console.log(`✅ WebSocket rodando na porta ${PORT}`);
});

// Função para enviar dados atualizados para todos os clientes conectados
function broadcast(data) {
  const json = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  });
}

// Monitoramento de hosts
function startMonitoring() {
  console.log('🔍 Monitoramento iniciado...');

  setInterval(() => {
    try {
      targets = JSON.parse(fs.readFileSync('targets.json', 'utf8'));
      config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

      const results = [];

      const checks = targets.map((host) =>
        ping.promise.probe(host.host).then((res) => {
          const isOnline = res.alive;
          const previousStatus = lastStatus[host.host];

          results.push({
            name: host.name,
            host: host.host,
            ok: isOnline,
            rtt: res.time,
            time: new Date().toLocaleTimeString(),
          });

          // Detecta mudança OFFLINE
          if (previousStatus === true && isOnline === false) {
            console.log(`⚠ ${host.name} (${host.host}) ficou OFFLINE!`);
          }

          // Detecta mudança ONLINE
          if (previousStatus === false && isOnline === true) {
            console.log(`✅ ${host.name} (${host.host}) voltou ONLINE!`);
          }

          lastStatus[host.host] = isOnline;
        })
      );

      Promise.all(checks).then(() => {
        broadcast(results);
      });
    } catch (err) {
      console.log(err);
    }
  }, config.interval || 10000);
}

// Inicia monitoramento
startMonitoring();
