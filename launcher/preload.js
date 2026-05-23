const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  openBrowser: () => ipcRenderer.invoke('open-browser'),
  onLog: (callback) => ipcRenderer.on('server-log', (_event, data) => callback(data)),
  onStatusChange: (callback) => ipcRenderer.on('server-status', (_event, status) => callback(status))
});
