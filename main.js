// ===== CONFIGURAÇÃO =====

let targets = []; // Será preenchido via WebSocket

let intervalMs = 5000;

// ===== FIM CONFIGURAÇÃO =====
 
const grid = document.getElementById('grid');

const toggleBtn = document.getElementById('toggle');

const refreshBtn = document.getElementById('refresh');
 
let running = true;
 
// Gera a interface de 3x3

function buildGrid() {

  grid.innerHTML = '';

  for (let i = 0; i < targets.length; i++) {

    const t = targets[i] || { name: `Vazio ${i + 1}`, host: '' };

    const card = document.createElement('div');

    card.className = 'card';

    card.id = 'card-' + i;

    card.innerHTML = `
<div>
<div class="title-row">
<div class="dot" id="dot-${i}" aria-hidden></div>
<div>
<div class="name" id="name-${i}">${escapeHtml(t.name)}</div>
<div class="host" id="host-${i}">${escapeHtml(t.host || '')}</div>
</div>
</div>
</div>
<div>
<div class="meta">
<div class="big-status" id="status-${i}">—</div>
<div id="rtt-${i}">—</div>
<div id="time-${i}"></div>
</div>
</div>`;

    grid.appendChild(card);

  }

}
 
// Função de escape simples

function escapeHtml(s) {

  return String(s).replace(/&/g, '&amp;')

                  .replace(/</g, '&lt;')

                  .replace(/>/g, '&gt;');

}
 
// Atualiza um bloco específico na UI

function updateBlock(i, result) {

  const card = document.getElementById('card-' + i);

  const dot = document.getElementById('dot-' + i);

  const status = document.getElementById('status-' + i);

  const rttEl = document.getElementById('rtt-' + i);

  const timeEl = document.getElementById('time-' + i);
 
  if (!card) return;

  if (result.ok) {

    card.classList.remove('red'); card.classList.add('green');

    dot.style.background = 'linear-gradient(180deg,var(--green), #34d399)';

    status.textContent = 'ONLINE';

    rttEl.textContent = result.rtt ? result.rtt + ' ms' : '';

    timeEl.textContent = result.time || '';

  } else {

    card.classList.remove('green'); card.classList.add('red');

    dot.style.background = 'linear-gradient(180deg,var(--red), #fb7185)';

    status.textContent = 'OFFLINE';

    rttEl.textContent = result.error || '';

    timeEl.textContent = result.time || '';

  }

}
 
// ===== INTEGRAÇÃO COM WEBSOCKET =====

const ws = new WebSocket('ws://localhost:8080'); // ajuste se necessário
 
ws.onopen = () => {

  console.log('Conectado ao servidor de monitoramento');

};
 
ws.onmessage = (event) => {

  try {

    let results = JSON.parse(event.data);
 
    // 1️⃣ Ordena: OFF (ok:false) primeiro

    results.sort((a, b) => a.ok === b.ok ? 0 : a.ok ? 1 : -1);
 
    // 2️⃣ Atualiza targets se estiver vazio (ou se quiser reconstruir a grid)

    if (targets.length === 0 || targets.length !== results.length) {

      targets = results.map(r => ({ name: r.name, host: r.host }));

      buildGrid();

    }
 
    // 3️⃣ Atualiza os blocos na tela

    results.forEach((res, i) => {

      updateBlock(i, {

        ok: res.ok,

        rtt: res.rtt,

        error: res.error,

        time: res.time

      });

    });
 
  } catch (err) {

    console.error('Erro ao processar mensagem WS:', err);

  }

};
 
ws.onclose = () => console.warn('Conexão com servidor fechada');

ws.onerror = (err) => console.error('Erro WS:', err);
 
// Botões

toggleBtn.addEventListener('click', () => {

  running = !running;

  toggleBtn.textContent = running ? 'Pausar' : 'Retomar';

});
 
refreshBtn.addEventListener('click', () => {

  if (ws.readyState === WebSocket.OPEN) {

    ws.send('refresh'); // o servidor pode ignorar ou usar para acionar ping imediato

  }

});
 
// Expor para debug

window.__monitor = { targets };

 