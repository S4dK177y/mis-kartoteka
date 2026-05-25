// Navigation
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(nav => nav.classList.remove('active'));
    views.forEach(view => view.classList.remove('active'));
    
    item.classList.add('active');
    document.getElementById(`view-${item.dataset.target}`).classList.add('active');
  });
});

// Elements
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnBrowser = document.getElementById('btn-browser');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const consoleOutput = document.getElementById('console-output');
const networkIp = document.getElementById('network-ip');

// Settings Elements
const configPort = document.getElementById('config-port');
const configNetwork = document.getElementById('config-network');
const btnSaveConfig = document.getElementById('btn-save-config');
const btnResetAdmin = document.getElementById('btn-reset-admin');

// Config and State
let currentConfig = { port: 8080, networkMode: 'local' };
let currentFilter = 'all';

async function init() {
  currentConfig = await window.api.getConfig();
  configPort.value = currentConfig.port;
  configNetwork.value = currentConfig.networkMode;
  await updateNetworkDisplay();
  
  const isRunning = await window.api.getStatus();
  updateUI(isRunning);
}

async function updateNetworkDisplay() {
  if (currentConfig.networkMode === 'local') {
    networkIp.textContent = `http://localhost:${currentConfig.port}`;
  } else {
    const ips = await window.api.getIps();
    if (ips.length > 0) {
      networkIp.innerHTML = ips.map(ip => `http://${ip}:${currentConfig.port}`).join('<br>');
    } else {
      networkIp.textContent = `http://localhost:${currentConfig.port}`;
    }
  }
}

btnSaveConfig.addEventListener('click', async () => {
  currentConfig.port = parseInt(configPort.value, 10) || 8080;
  currentConfig.networkMode = configNetwork.value;
  await window.api.saveConfig(currentConfig);
  await updateNetworkDisplay();
  
  const btn = btnSaveConfig;
  const originalText = btn.textContent;
  btn.textContent = 'Сохранено!';
  btn.classList.replace('btn-primary', 'btn-success');
  btn.style.background = 'var(--success)';
  setTimeout(() => {
    btn.textContent = originalText;
    btn.style.background = '';
    btn.classList.replace('btn-success', 'btn-primary');
  }, 2000);
});

btnResetAdmin.addEventListener('click', async () => {
  if (confirm('Вы уверены, что хотите сбросить пароль администратора на "admin"? Это действие нельзя отменить.')) {
    const btn = btnResetAdmin;
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Сброс...';
    btn.disabled = true;
    
    const res = await window.api.resetAdmin();
    alert(res.message);
    
    btn.innerHTML = originalText;
    btn.disabled = false;
  }
});

// Console Logic
function appendLog(text) {
  let isError = text.includes('[ОШИБКА]') || text.includes('Error') || text.includes('Exception');
  let isInfo = !isError && (text.includes('[СИСТЕМА]') || text.includes('Server') || text.includes('GET') || text.includes('POST') || text.includes('PUT') || text.includes('DELETE'));
  
  let formattedText = text
    .replace(/\[ОШИБКА\]/g, '<span style="color: #ef4444; font-weight: bold;">[ОШИБКА]</span>')
    .replace(/\[СИСТЕМА\]/g, '<span style="color: #3b82f6; font-weight: bold;">[СИСТЕМА]</span>')
    .replace(/Сервер запущен на порту/gi, '<span style="color: #10b981; font-weight: bold;">Сервер запущен на порту</span>');

  const span = document.createElement('span');
  span.innerHTML = formattedText;
  span.style.display = 'block';
  
  if (isError) {
    span.dataset.type = 'error';
    span.style.color = '#fca5a5';
  } else if (isInfo) {
    span.dataset.type = 'info';
  } else {
    span.dataset.type = 'other';
  }

  if (currentFilter === 'error' && !isError) span.style.display = 'none';
  if (currentFilter === 'info' && (!isInfo && !isError)) span.style.display = 'none';
  
  consoleOutput.appendChild(span);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

document.getElementById('btn-clear').addEventListener('click', () => {
  consoleOutput.innerHTML = '';
});

const filterAll = document.getElementById('filter-all');
const filterInfo = document.getElementById('filter-info');
const filterError = document.getElementById('filter-error');

function setFilter(filter, btn) {
  currentFilter = filter;
  filterAll.classList.remove('active');
  filterInfo.classList.remove('active');
  filterError.classList.remove('active');
  btn.classList.add('active');
  
  Array.from(consoleOutput.children).forEach(child => {
    if (filter === 'all') child.style.display = 'block';
    else if (filter === 'info') child.style.display = (child.dataset.type === 'info' || child.dataset.type === 'error') ? 'block' : 'none';
    else if (filter === 'error') child.style.display = child.dataset.type === 'error' ? 'block' : 'none';
  });
}

filterAll.addEventListener('click', () => setFilter('all', filterAll));
filterInfo.addEventListener('click', () => setFilter('info', filterInfo));
filterError.addEventListener('click', () => setFilter('error', filterError));

function updateUI(isRunning) {
  if (isRunning) {
    btnStart.disabled = true;
    btnStop.disabled = false;
    btnBrowser.disabled = false;
    statusIndicator.className = 'indicator online';
    statusText.textContent = `Работает (Порт ${currentConfig.port})`;
    statusText.style.color = 'var(--success)';
  } else {
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnBrowser.disabled = true;
    statusIndicator.className = 'indicator offline';
    statusText.textContent = 'Остановлен';
    statusText.style.color = 'var(--text-main)';
  }
}

btnStart.addEventListener('click', async () => {
  appendLog('<span style="color: #3b82f6;">> Запуск базы данных и сервера...</span>\n');
  const res = await window.api.startServer();
  if (res.success) {
    updateUI(true);
  } else {
    appendLog(`<span style="color: #ef4444;">[ОШИБКА] ${res.message}</span>\n`);
  }
});

btnStop.addEventListener('click', async () => {
  appendLog('<span style="color: #f59e0b;">> Остановка сервера...</span>\n');
  await window.api.stopServer();
  updateUI(false);
});

btnBrowser.addEventListener('click', () => {
  window.api.openBrowser();
});

window.api.onLog((data) => {
  appendLog(data);
});

window.api.onStatusChange((status) => {
  updateUI(status);
});

init();
