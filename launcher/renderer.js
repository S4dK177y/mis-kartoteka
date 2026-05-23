const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');
const btnBrowser = document.getElementById('btn-browser');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const consoleOutput = document.getElementById('console-output');

let currentFilter = 'all';

function appendLog(text) {
  let isError = text.includes('[ОШИБКА]') || text.includes('Error') || text.includes('Exception');
  let isInfo = !isError && (text.includes('[СИСТЕМА]') || text.includes('Server') || text.includes('GET') || text.includes('POST') || text.includes('PUT') || text.includes('DELETE'));
  
  let formattedText = text
    .replace(/\[ОШИБКА\]/g, '<span style="color: #ef4444; font-weight: bold;">[ОШИБКА]</span>')
    .replace(/\[СИСТЕМА\]/g, '<span style="color: #0ea5e9; font-weight: bold;">[СИСТЕМА]</span>')
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
    statusText.textContent = 'Работает (Порт 8080)';
  } else {
    btnStart.disabled = false;
    btnStop.disabled = true;
    btnBrowser.disabled = true;
    statusIndicator.className = 'indicator offline';
    statusText.textContent = 'Остановлен';
  }
}

btnStart.addEventListener('click', async () => {
  appendLog('<span style="color: #0ea5e9;">> Запуск базы данных и сервера...</span>\n');
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

// Check initial status
window.api.getStatus().then(updateUI);
