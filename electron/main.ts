import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import http from 'http';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
let serverStarted = false;
let startupErrors: string[] = [];

const SERVER_PORT = 5000;
const SERVER_URL = `http://127.0.0.1:${SERVER_PORT}`;

function isPackaged(): boolean {
  return app.isPackaged || !process.execPath.includes('node');
}

function getResourcePath(): string {
  if (isPackaged()) {
    return path.join(process.resourcesPath, 'app.asar.unpacked');
  }
  return app.getAppPath();
}

function logToFile(message: string) {
  const logPath = path.join(app.getPath('userData'), 'startup.log');
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (e) {
  }
  console.log(message);
}

function waitForServer(maxAttempts = 60): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const checkServer = () => {
      attempts++;
      logToFile(`Checking server health (attempt ${attempts}/${maxAttempts})...`);
      const req = http.get(`${SERVER_URL}/api/health`, (res) => {
        if (res.statusCode === 200) {
          logToFile('Server is ready!');
          resolve(true);
        } else {
          retry();
        }
      });
      req.on('error', (e) => {
        logToFile(`Server check error: ${e.message}`);
        retry();
      });
      req.setTimeout(2000, () => {
        req.destroy();
        retry();
      });
    };
    const retry = () => {
      if (attempts < maxAttempts) {
        setTimeout(checkServer, 500);
      } else {
        logToFile('Server failed to respond after max attempts');
        resolve(false);
      }
    };
    checkServer();
  });
}

async function startServer(): Promise<boolean> {
  process.env.PORT = String(SERVER_PORT);
  process.env.APP_PATH = app.getAppPath();
  process.env.RESOURCE_PATH = getResourcePath();
  process.env.USER_DATA_PATH = app.getPath('userData');
  process.env.IS_PACKAGED = isPackaged() ? 'true' : 'false';
  
  logToFile('=== Starting Airavoto Gaming POS ===');
  logToFile(`Is packaged: ${isPackaged()}`);
  logToFile(`APP_PATH: ${app.getAppPath()}`);
  logToFile(`RESOURCE_PATH: ${getResourcePath()}`);
  logToFile(`USER_DATA_PATH: ${app.getPath('userData')}`);
  logToFile(`__dirname: ${__dirname}`);
  logToFile(`process.execPath: ${process.execPath}`);
  logToFile(`process.resourcesPath: ${process.resourcesPath || 'N/A'}`);
  
  const serverPaths = [
    path.join(app.getAppPath(), 'dist-electron', 'server', 'index-electron.js'),
    path.join(__dirname, '..', 'server', 'index-electron.js'),
    path.join(getResourcePath(), 'dist-electron', 'server', 'index-electron.js'),
  ];
  
  for (const serverPath of serverPaths) {
    logToFile(`Checking server path: ${serverPath}`);
    logToFile(`  Exists: ${fs.existsSync(serverPath)}`);
  }
  
  for (const serverPath of serverPaths) {
    if (!fs.existsSync(serverPath)) {
      logToFile(`Skipping non-existent path: ${serverPath}`);
      continue;
    }
    
    logToFile(`Trying to import server from: ${serverPath}`);
    try {
      const serverUrl = pathToFileURL(serverPath).href;
      logToFile(`Importing from URL: ${serverUrl}`);
      await import(serverUrl);
      logToFile(`Server started successfully from: ${serverPath}`);
      serverStarted = true;
      return true;
    } catch (e: any) {
      const errorMsg = `Failed to load server from: ${serverPath}\nError: ${e.message}\nStack: ${e.stack}`;
      logToFile(errorMsg);
      startupErrors.push(errorMsg);
    }
  }
  
  logToFile('All server paths failed');
  return false;
}

async function createWindow() {
  logToFile('Creating main window...');
  
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
    },
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#1a1a2e',
  });

  mainWindow.once('ready-to-show', () => {
    logToFile('Window ready to show');
    mainWindow?.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    logToFile(`Page load failed: ${errorCode} - ${errorDescription}`);
    setTimeout(() => {
      logToFile('Retrying page load...');
      mainWindow?.loadURL(SERVER_URL);
    }, 2000);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    logToFile('Page loaded successfully');
  });

  if (!isPackaged()) {
    mainWindow.webContents.openDevTools();
  }

  logToFile(`Loading URL: ${SERVER_URL}`);
  await mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function showStartupError(errorMessage: string) {
  const logPath = path.join(app.getPath('userData'), 'startup.log');
  const detailedMessage = `${errorMessage}\n\nStartup log saved to:\n${logPath}\n\nErrors:\n${startupErrors.join('\n\n')}`;
  
  dialog.showErrorBox('Airavoto Gaming POS - Startup Error', detailedMessage);
}

app.whenReady().then(async () => {
  logToFile('App is ready, starting initialization...');
  
  try {
    const serverOk = await startServer();
    
    if (serverOk) {
      logToFile('Waiting for server to be ready...');
      const serverReady = await waitForServer();
      
      if (serverReady) {
        await createWindow();
      } else {
        showStartupError('Server started but did not respond in time.\nPlease check the startup log for details.');
        app.quit();
      }
    } else {
      showStartupError('Failed to start the application server.\nPlease check the startup log for details.');
      app.quit();
    }
  } catch (e: any) {
    logToFile(`Uncaught error during startup: ${e.message}\n${e.stack}`);
    showStartupError(`Unexpected error during startup:\n${e.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null && serverStarted) {
    createWindow();
  }
});

ipcMain.handle('get-app-version', () => app.getVersion());
ipcMain.handle('get-app-path', () => app.getPath('userData'));
ipcMain.handle('show-message-box', async (_event, options) => {
  return dialog.showMessageBox(options);
});
ipcMain.handle('show-open-dialog', async (_event, options) => {
  return dialog.showOpenDialog(options);
});
ipcMain.handle('show-save-dialog', async (_event, options) => {
  return dialog.showSaveDialog(options);
});
ipcMain.handle('open-external', async (_event, url) => {
  return shell.openExternal(url);
});
ipcMain.handle('get-startup-log', () => {
  const logPath = path.join(app.getPath('userData'), 'startup.log');
  try {
    return fs.readFileSync(logPath, 'utf-8');
  } catch {
    return 'No startup log available';
  }
});

process.on('uncaughtException', (e) => {
  logToFile(`Uncaught exception: ${e.message}\n${e.stack}`);
  console.error('Uncaught exception:', e);
});

process.on('unhandledRejection', (reason: any) => {
  logToFile(`Unhandled rejection: ${reason?.message || reason}\n${reason?.stack || ''}`);
  console.error('Unhandled rejection:', reason);
});

