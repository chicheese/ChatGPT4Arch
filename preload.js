const { contextBridge, ipcRenderer } = require('electron');

const withListener = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  getTheme: () => ipcRenderer.invoke('theme:get'),
  onThemeUpdated: callback => withListener('theme:updated', callback),
  onWindowFocus: callback => withListener('window:focus', callback),
  onWindowMaximize: callback => withListener('window:maximized', callback),
  openExternal: url => ipcRenderer.invoke('app:open-external', url),
  debugLog: payload => ipcRenderer.invoke('debug:log', Array.isArray(payload) ? payload : [payload])
});
