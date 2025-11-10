const CHATGPT_URL = 'https://chatgpt.com';
const STATUS_PAGE_URL = 'https://status.openai.com/';

const appShell = document.querySelector('.app-shell');
const webview = document.getElementById('chatgpt-view');
const reloadButton = document.getElementById('reload-chat');
const retryButton = document.getElementById('retry-load');
const statusButton = document.getElementById('open-status-page');
const statusOverlay = document.getElementById('status-overlay');
const maximizeButton = document.querySelector('[data-action="maximize"]');
const contentContainer = document.querySelector('.content');

const log = (...args) => {
  if (window?.electronAPI?.debugLog) {
    window.electronAPI.debugLog(args);
  } else {
    console.log('[glass-fallback]', ...args);
  }
};

const setOverlayVisible = visible => {
  statusOverlay.hidden = !visible;
};

const setMaximizeState = isMaximized => {
  if (isMaximized) {
    maximizeButton.classList.add('is-active');
    maximizeButton.setAttribute('aria-pressed', 'true');
  } else {
    maximizeButton.classList.remove('is-active');
    maximizeButton.setAttribute('aria-pressed', 'false');
  }
};

const applyTheme = payload => {
  const theme = typeof payload === 'string' ? payload : payload?.mode;
  if (theme) {
    document.body.dataset.theme = theme;
  }

  if (payload && Object.prototype.hasOwnProperty.call(payload, 'glassEnabled')) {
    appShell.dataset.glass = payload.glassEnabled ? 'true' : 'false';
  }
};

const initializeTheme = async () => {
  try {
    const theme = await window.electronAPI.getTheme();
    applyTheme({ mode: theme, glassEnabled: appShell.dataset.glass !== 'false' });
    document.body.classList.add('focused');
  } catch (error) {
    console.error('Failed to resolve theme:', error);
  }
};

const wireWindowControls = () => {
  document
    .querySelectorAll('.window-controls [data-action]')
    .forEach(button => {
      button.addEventListener('click', async event => {
        const action = event.currentTarget.dataset.action;

        switch (action) {
          case 'close':
            window.electronAPI.close();
            break;
          case 'minimize':
            window.electronAPI.minimize();
            break;
          case 'maximize': {
            const isMaximized = await window.electronAPI.toggleMaximize();
            setMaximizeState(isMaximized);
            break;
          }
          default:
            break;
        }
      });
    });

  window.electronAPI.onWindowMaximize(isMaximized => {
    setMaximizeState(isMaximized);
  });

  window.electronAPI.onWindowFocus(hasFocus => {
    document.body.classList.toggle('focused', Boolean(hasFocus));
  });
};

const wireStatusActions = () => {
  reloadButton.addEventListener('click', () => {
    setOverlayVisible(false);
    webview.reload();
  });

  retryButton.addEventListener('click', () => {
    setOverlayVisible(false);
    webview.loadURL(CHATGPT_URL);
  });

  statusButton.addEventListener('click', () => {
    window.electronAPI.openExternal(STATUS_PAGE_URL);
  });
};

const wireWebViewEvents = () => {
  if (!contentContainer) {
    log('Missing content container for webview sizing.');
    return;
  }

  let guestContents = null;

  const syncWebviewSize = rect => {
    if (!rect) {
      const fallback = contentContainer.getBoundingClientRect();
      rect = fallback;
    }
    const size = {
      x: rect.x ?? contentContainer.offsetLeft ?? 0,
      y: rect.y ?? contentContainer.offsetTop ?? 0,
      width: Math.max(Math.round(rect.width ?? 0), 0),
      height: Math.max(Math.round(rect.height ?? 0), 0)
    };
    const { width, height } = size;
    log('container rect', size);
    log('resize webview ->', { width, height });
    webview.style.width = `${width}px`;
    webview.style.height = `${height}px`;
    if (guestContents) {
      try {
        guestContents.setSize({ normal: { width, height } });
      } catch (error) {
        log('guest setSize failed', error?.message ?? error);
      }
    }
  };

  const resizeObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      syncWebviewSize(entry.contentRect);
    }
  });

  resizeObserver.observe(contentContainer);
  syncWebviewSize();
  window.addEventListener('resize', () => syncWebviewSize());

  webview.addEventListener('did-start-loading', () => {
    document.body.classList.add('loading');
  });

  webview.addEventListener('did-stop-loading', () => {
    document.body.classList.remove('loading');
  });

  webview.addEventListener('did-attach', () => {
    try {
      guestContents = webview.getWebContents?.() ?? null;
      log('webview attached', webview.getBoundingClientRect());
      if (guestContents) {
        log('guest webContents id', guestContents.id);
        guestContents.setAutoResize?.({
          width: true,
          height: true
        });
      }
    } catch (error) {
      log('failed to attach guest webContents', error?.message ?? error);
    }
  });

  webview.addEventListener('did-finish-load', () => {
    log('webview finished load', webview.getBoundingClientRect());
    setOverlayVisible(false);
  });

  webview.addEventListener('did-fail-load', event => {
    if (!event.isMainFrame) {
      return;
    }

    setOverlayVisible(true);
  });

  webview.addEventListener('new-window', event => {
    event.preventDefault();
    const targetUrl = event.url;

    if (!targetUrl) {
      return;
    }

    if (targetUrl.startsWith(CHATGPT_URL)) {
      webview.loadURL(targetUrl);
      return;
    }

    window.electronAPI.openExternal(targetUrl);
  });

  webview.addEventListener('will-navigate', event => {
    if (!event.url.startsWith('https://')) {
      event.preventDefault();
    }
  });
};

const setupThemeObservers = () => {
  window.electronAPI.onThemeUpdated(payload => {
    applyTheme(payload);
  });

  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', event => {
    applyTheme({ mode: event.matches ? 'dark' : 'light' });
  });
};

const init = () => {
  initializeTheme();
  setupThemeObservers();
  wireWindowControls();
  wireStatusActions();
  wireWebViewEvents();
};

document.addEventListener('DOMContentLoaded', init);
