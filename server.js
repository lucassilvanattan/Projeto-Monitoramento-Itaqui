const WebSocket = require('ws');
const ping = require('ping');
const fs = require('fs');
 
let targets = [];
 
// Função para carregar a lista de targets do JSON
function loadTargets() {
  try {
    const data = fs.readFileSync('./targets.json', 'utf-8');
    targets = JSON.parse(data);
    console.log('Lista de hosts carregada:', targets);
  } catch (err) {
    console.error('Erro ao carregar targets.json:', err);
  }
}
 
// Carrega inicialmente
loadTargets();
 
// Opcional: atualiza automaticamente ao alterar o arquivo
fs.watch('./targets.json', (eventType) => {
  if (eventType === 'change') {
    console.log('Arquivo targets.json alterado, recarregando...');
    loadTargets();
  }
});
 
const wss = new WebSocket.Server({ port: 8080 });
console.log("Servidor WebSocket rodando na porta 8080");
 
wss.on('connection', (ws) => {
  console.log('Cliente conectado');
 
  async function runPings() {
    const results = [];
    for (const t of targets) {
      try {
        const res = await ping.promise.probe(t.host, { timeout: 2 });
        results.push({
          name: t.name,
          host: t.host,
          ok: res.alive,
          rtt: res.time === 'unknown' ? null : Number(res.time),
          time: new Date().toLocaleTimeString()
        });
      } catch (err) {
        results.push({
          name: t.name,
          host: t.host,
          ok: false,
          error: err.message,
          time: new Date().toLocaleTimeString()
        });
      }
    }
    ws.send(JSON.stringify(results));
  }
 
  const interval = setInterval(runPings, 5000);
  runPings();
 
  ws.on('close', () => {
    clearInterval(interval);
    console.log('Cliente desconectado');
  });
});