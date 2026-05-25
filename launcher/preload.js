const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startServer: () => ipcRenderer.invoke('start-server'),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  getStatus: () => ipcRenderer.invoke('get-status'),
  openBrowser: () => ipcRenderer.invoke('open-browser'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  getIps: () => ipcRenderer.invoke('get-ips'),
  resetAdmin: () => ipcRenderer.invoke('reset-admin'),
  onLog: (callback) => ipcRenderer.on('server-log', (_event, data) => callback(data)),
  onStatusChange: (callback) => ipcRenderer.on('server-status', (_event, status) => callback(status))
});
