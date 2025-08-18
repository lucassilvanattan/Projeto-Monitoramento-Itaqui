
async function loadUsers(){
  try{
    const res = await fetch('users.json', {cache:'no-store'});
    if(!res.ok) throw new Error('Sem arquivo externo');
    return await res.json();
  }catch(e){
    return { users: [
      { username: "admin", password: "123456", name: "Administrador" },
      { username: "convidado", password: "123456", name: "123456" },
      { username: "guest", password: "guest", name: "Convidado" }
    ]};
  }
}

const form = document.getElementById('loginForm');
const username = document.getElementById('username');
const password = document.getElementById('password');
const remember = document.getElementById('remember');
const statusBox = document.getElementById('status');
const submitBtn = document.getElementById('submitBtn');
const spinner = document.getElementById('spin');

function toggleButton(){
  submitBtn.disabled = !(username.value.trim() && password.value.trim());
}
username.addEventListener('input', toggleButton);
password.addEventListener('input', toggleButton);

document.getElementById('togglePwd').addEventListener('click', ()=>{
  password.type = password.type === 'password' ? 'text' : 'password';
});

const caps = document.getElementById('caps');
password.addEventListener('keydown', e => {
  caps.style.display = e.getModifierState && e.getModifierState('CapsLock') ? 'block' : 'none';
});
password.addEventListener('blur', ()=> caps.style.display = 'none');

function saveSession(user){
  const payload = { username: user.username, name: user.name, ts: Date.now() };
  if(remember.checked){
    localStorage.setItem('session', JSON.stringify(payload));
  } else {
    sessionStorage.setItem('session', JSON.stringify(payload));
  }
}

function setStatus(msg, ok=false){
  statusBox.textContent = msg;
  statusBox.className = 'status ' + (ok ? 'ok' : 'error');
}

document.getElementById('forgot').addEventListener('click', e => {
  e.preventDefault();
  setStatus('Para redefinir a senha, contate o administrador.', false);
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  setStatus('');
  submitBtn.disabled = true; spinner.style.display = 'inline-block';

  try{
    const { users } = await loadUsers();
    await new Promise(r=>setTimeout(r,600));
    const u = username.value.trim();
    const p = password.value;
    const found = users.find(x => x.username === u);

    if(!found){ setStatus('Usuário não encontrado.', false); return; }
    if(found.password !== p){ setStatus('Senha incorreta.', false); return; }

    saveSession(found);
    setStatus(`Bem-vindo(a), ${found.name}!`, true);
        window.location.href = 'index.html';
  }catch(err){
    setStatus('Erro ao realizar login.', false);
  }finally{
    spinner.style.display = 'none';
    toggleButton();
  }
});