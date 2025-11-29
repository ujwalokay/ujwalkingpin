import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import isDev from 'electron-is-dev';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serverStarted = false;

const SERVER_PORT = 5000;

async function startServer() {
  process.env.PORT = String(SERVER_PORT);
  
  try {
    const serverPath = path.join(__dirname, '../server/index-electron.js');
    console.log('Loading server from:', serverPath);
    await import(serverPath);
    console.log('Express server started on port', SERVER_PORT);
    serverStarted = true;
  } catch (error) {
    console.error('Failed to start server:', error);
    serverStarted = false;
  }
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    title: 'Airavoto Gaming POS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
    },
    autoHideMenuBar: true,
    show: true,
    backgroundColor: '#1a1a2e',
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    if (mainWindow) {
      mainWindow.loadURL(`data:text/html,
        <html>
          <body style="background:#1a1a2e;color:white;font-family:sans-serif;padding:40px;text-align:center;">
            <h1>Airavoto Gaming POS</h1>
            <p>Server is starting... Please wait.</p>
            <p style="color:#888;">If this persists, restart the application.</p>
            <script>setTimeout(() => location.reload(), 3000);</script>
          </body>
        </html>
      `);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
    mainWindow?.show();
    mainWindow?.focus();
  });

  const serverUrl = `http://127.0.0.1:${SERVER_PORT}`;
  console.log('Loading URL:', serverUrl);
  
  mainWindow.loadURL(serverUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });
}

app.whenReady().then(async () => {
  console.log('App ready, starting server...');
  await startServer();
  setTimeout(() => {
    console.log('Creating window...');
    createWindow();
  }, 1500);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('show-message-box', async (_, options) => {
  if (mainWindow) {
    return dialog.showMessageBox(mainWindow, options);
  }
  return null;
});

ipcMain.handle('show-open-dialog', async (_, options) => {
  if (mainWindow) {
    return dialog.showOpenDialog(mainWindow, options);
  }
  return null;
});

ipcMain.handle('show-save-dialog', async (_, options) => {
  if (mainWindow) {
    return dialog.showSaveDialog(mainWindow, options);
  }
  return null;
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
