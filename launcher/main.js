const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let mainWindow;
let serverProcess = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    },
    icon: path.join(__dirname, 'build/icon.png'),
    autoHideMenuBar: true,
    title: 'МИС Картотека - Управление сервером'
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (serverProcess) {
    serverProcess.kill();
  }
  if (process.platform !== 'darwin') app.quit();
});

const fs = require('fs');

function findBackendPath() {
  if (!app.isPackaged) return path.join(__dirname, '../backend');
  
  const exeDir = path.dirname(app.getPath('exe'));
  
  // 1. Check if backend is in the same folder as .exe
  let checkPath = path.join(exeDir, 'backend');
  if (fs.existsSync(path.join(checkPath, 'index.js'))) return checkPath;
  
  // 2. Check if backend is one level up
  checkPath = path.join(exeDir, '../backend');
  if (fs.existsSync(path.join(checkPath, 'index.js'))) return checkPath;

  // 3. Check if backend is two levels up (e.g. dist/win-unpacked/)
  checkPath = path.join(exeDir, '../../backend');
  if (fs.existsSync(path.join(checkPath, 'index.js'))) return checkPath;

  // Default fallback (will probably fail, but keeps it from crashing immediately)
  return path.join(exeDir, 'backend');
}

ipcMain.handle('start-server', async () => {
  if (serverProcess) return { success: false, message: 'Server already running' };
  
  try {
    const backendPath = findBackendPath();
    
    // Check if index.js actually exists to prevent ENOENT crash
    if (!fs.existsSync(path.join(backendPath, 'index.js'))) {
      return { success: false, message: `Не найден backend/index.js в пути: ${backendPath}` };
    }

    serverProcess = fork(path.join(backendPath, 'index.js'), [], { 
      cwd: backendPath,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => {
      if (mainWindow) mainWindow.webContents.send('server-log', data.toString());
    });

    serverProcess.stderr.on('data', (data) => {
      if (mainWindow) mainWindow.webContents.send('server-log', `[ОШИБКА] ${data.toString()}`);
    });

    serverProcess.on('close', (code) => {
      if (mainWindow) {
        mainWindow.webContents.send('server-log', `\n[СИСТЕМА] Процесс сервера остановлен (код ${code})\n`);
        mainWindow.webContents.send('server-status', false);
      }
      serverProcess = null;
    });

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('stop-server', async () => {
  if (!serverProcess) return { success: false, message: 'Server is not running' };
  
  serverProcess.kill();
  serverProcess = null;
  return { success: true };
});

ipcMain.handle('get-status', () => {
  return !!serverProcess;
});

ipcMain.handle('open-browser', () => {
  require('electron').shell.openExternal('http://localhost:8080');
});
