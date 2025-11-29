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
  process.env.APP_PATH = app.getAppPath();
  
  try {
    const possiblePaths = [
      path.join(__dirname, '../server/index-electron.js'),
      path.join(__dirname, '../../server/index-electron.js'),
      path.join(app.getAppPath(), 'dist-electron', 'server', 'index-electron.js'),
    ];
    
    let serverLoaded = false;
    for (const serverPath of possiblePaths) {
      console.log('Trying server path:', serverPath);
      try {
        await import(serverPath);
        console.log('Express server started from:', serverPath);
        serverStarted = true;
        serverLoaded = true;
        break;
      } catch (e) {
        console.log('Path failed:', serverPath);
      }
    }
    
    if (!serverLoaded) {
      throw new Error('Could not find server file');
    }
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

  mainWindow.webContents.on('did-fail-load', () => {
    if (mainWindow) {
      mainWindow.loadURL(`data:text/html,
        <html>
          <body style="background:#1a1a2e;color:white;font-family:sans-serif;padding:40px;text-align:center;">
            <h1>Airavoto Gaming POS</h1>
            <p>Loading... Please wait.</p>
            <script>setTimeout(() => location.reload(), 3000);</script>
          </body>
        </html>
      `);
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  const serverUrl = `http://127.0.0.1:${SERVER_PORT}`;
  mainWindow.loadURL(serverUrl);
  mainWindow.webContents.openDevTools();

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
  console.log('App path:', app.getAppPath());
  await startServer();
  setTimeout(() => createWindow(), 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));

process.on('uncaughtException', (error) => console.error('Uncaught:', error));
process.on('unhandledRejection', (reason) => console.error('Unhandled:', reason));