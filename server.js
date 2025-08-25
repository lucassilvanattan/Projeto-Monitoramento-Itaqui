const WebSocket = require('ws');
const ping = require('ping');
const fs = require('fs');
// const venom = require('venom-bot');

const PORT = 8080;
let targets = JSON.parse(fs.readFileSync('targets.json', 'utf8'));
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

// Inicia o Venom-bot
// venom
//   .create({ session: 'monitoramento' })
//   .then((client) => {
//     console.log('📲 Venom conectado ao WhatsApp!');
//     startMonitoring(client);
//   })
//   .catch((err) => console.error(err));

function startMonitoring(client) {
  console.log('🔍 Monitoramento iniciado...');

  setInterval(() => {
    // Recarrega lista de targets (sem precisar reiniciar server.js)
    targets = JSON.parse(fs.readFileSync('targets.json', 'utf8'));

    const results = [];

    // Faz ping em todos os hosts
    const checks = targets.map((host) =>
      ping.promise.probe(host.host).then((res) => {
        const isOnline = res.alive;
        const previousStatus = lastStatus[host.host];

        results.push({
          name: host.name,
          host: host.host,
          ok: isOnline,     // booleano, não string
          rtt: res.time,
          time: new Date().toLocaleTimeString(), 
        });

        // Detecta mudança OFFLINE
        if (previousStatus === true && isOnline === false) {
          console.log(`⚠ ${host.name} (${host.host}) ficou OFFLINE!`);
          sendAlert(client, host, false);
        }

        // Detecta mudança ONLINE
        if (previousStatus === false && isOnline === true) {
          console.log(`✅ ${host.name} (${host.host}) voltou ONLINE!`);
          sendAlert(client, host, true);
        }

        // Atualiza status
        lastStatus[host.host] = isOnline;
      })
    );

    Promise.all(checks).then(() => {
      // Envia atualização para o front-end
      broadcast(results);
    });
  }, 3000); // 30 segundos
}

startMonitoring()

// Função para enviar alerta no WhatsApp
// function sendAlert(client, host, isOnline) {
//   const statusMsg = isOnline ? '✅ voltou ONLINE' : '⚠ ficou OFFLINE';
//   const message = `${statusMsg}: ${host.name} (${host.ip})`;

//   // Seu número
//   client.sendText('55SEUNUMERO@c.us', message);

//   // Número do colega
//   client.sendText('55NUMEROCOLEGA@c.us', message);
// }
