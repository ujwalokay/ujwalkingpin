import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

const SERVER_PORT = 5000;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

function waitForServer(maxAttempts = 30): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkServer = () => {
      attempts++;
      const req = http.get(`${SERVER_URL}/api/health`, (res) => {
        if (res.statusCode === 200) { resolve(true); } else { retry(); }
      });
      req.on('error', () => retry());
      req.setTimeout(1000, () => { req.destroy(); retry(); });
    };
    const retry = () => {
      if (attempts < maxAttempts) setTimeout(checkServer, 500);
      else resolve(false);
    };
    checkServer();
  });
}

async function startServer() {
  process.env.PORT = String(SERVER_PORT);
  process.env.APP_PATH = app.getAppPath();
  
  const serverPaths = [
    path.join(app.getAppPath(), 'dist-electron', 'server', 'index-electron.js'),
    path.join(__dirname, '../server/index-electron.js'),
  ];
  
  for (const serverPath of serverPaths) {
    try {
      await import(serverPath);
      return true;
    } catch (e) {}
  }
  return false;
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1024, minHeight: 768,
    title: 'Airavoto Gaming POS',
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    autoHideMenuBar: true, show: true, backgroundColor: '#1a1a2e',
  });
  mainWindow.webContents.on('did-fail-load', () => setTimeout(() => mainWindow?.loadURL(SERVER_URL), 2000));
  mainWindow.loadURL(SERVER_URL);
  mainWindow.webContents.openDevTools();
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  const ok = await startServer();
  if (ok) { await waitForServer(); createWindow(); }
  else { dialog.showErrorBox('Error', 'Server failed'); app.quit(); }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));
process.on('uncaughtException', (e) => console.error(e));