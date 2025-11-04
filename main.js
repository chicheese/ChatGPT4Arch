const { app, BrowserWindow, nativeTheme } = require('electron');
const path = require('node:path');

const CHATGPT_URL = 'https://chatgpt.com';

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 720,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1e1e1e' : '#ffffff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true
    }
  });

  window.once('ready-to-show', () => window.show());

  const loadChatGPT = () => {
    window.loadURL(CHATGPT_URL).catch(() => {
      window.loadFile('index.html');
    });
  };

  window.webContents.setWindowOpenHandler(details => {
    window.loadURL(details.url);
    return { action: 'deny' };
  });

  window.webContents.on('did-fail-load', () => {
    window.loadFile('index.html').catch(() => {
      window.webContents.executeJavaScript(`document.body.innerHTML = '<h1 style="font-family: sans-serif; color: #f87171; text-align: center; margin-top: 20vh;">Unable to reach chatgpt.com</h1>';`);
    });
  });

  loadChatGPT();
}

app.whenReady().then(() => {
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
