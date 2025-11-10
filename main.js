const { app, BrowserWindow, ipcMain, nativeTheme, shell } = require('electron');
const path = require('node:path');

const CHATGPT_URL = 'https://chatgpt.com';
const isMac = process.platform === 'darwin';
const glassDisabled = process.env.CHATGPT_DISABLE_GLASS === '1';

if (!glassDisabled) {
  app.commandLine.appendSwitch('enable-transparent-visuals');
}

let mainWindow;

const getTheme = () => (nativeTheme.shouldUseDarkColors ? 'dark' : 'light');

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 960,
    minHeight: 600,
    frame: false,
    resizable: true,
    transparent: !glassDisabled,
    backgroundColor: glassDisabled
      ? nativeTheme.shouldUseDarkColors
        ? '#1e1e1e'
        : '#f6f6f6'
      : '#00000000',
    show: false,
    hasShadow: !glassDisabled,
    vibrancy: !glassDisabled && isMac ? 'under-window' : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webviewTag: true,
      spellcheck: true
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.on('focus', () => {
    mainWindow.webContents.send('window:focus', true);
  });

  mainWindow.on('blur', () => {
    mainWindow.webContents.send('window:focus', false);
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window:maximized', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window:maximized', false);
  });

  mainWindow.loadFile(path.join(__dirname, 'ui', 'index.html'));
}

function registerIpc() {
  ipcMain.handle('window:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) {
      return false;
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    }

    mainWindow.maximize();
    return true;
  });

  ipcMain.handle('window:close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.handle('theme:get', () => getTheme());

  ipcMain.handle('app:open-external', (_event, url) => {
    if (typeof url === 'string' && url.startsWith('http')) {
      return shell.openExternal(url);
    }
    return false;
  });

  ipcMain.handle('debug:log', (_event, payload) => {
    if (Array.isArray(payload)) {
      console.log('[glass-debug]', ...payload);
    } else {
      console.log('[glass-debug]', payload);
    }
  });
}

app.whenReady().then(() => {
  registerIpc();

  createMainWindow();

  const notifyTheme = () => {
    if (mainWindow) {
      mainWindow.webContents.send('theme:updated', {
        mode: getTheme(),
        glassEnabled: !glassDisabled
      });
    }
  };

  notifyTheme();

  nativeTheme.on('updated', notifyTheme);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      notifyTheme();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('browser-window-created', (_event, window) => {
  if (glassDisabled) {
    window.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#f6f6f6');
  }
});

module.exports = {
  CHATGPT_URL
};
