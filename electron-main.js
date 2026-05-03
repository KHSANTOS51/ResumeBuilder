const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { startServer } = require('./server');

let objMainWindow;
let objServer;
let intServerPort;

const createWindow = async () => {
  if (!objServer) {
    const objServerInfo = await startServer(0);
    objServer = objServerInfo.server;
    intServerPort = objServerInfo.port;
  }

  objMainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 700,
    title: 'ResumeForge',
    icon: path.join(__dirname, 'public', 'favicon.svg'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  objMainWindow.loadURL(`http://localhost:${intServerPort}`);

  objMainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  objMainWindow.on('closed', () => {
    objMainWindow = null;
  });
};

app.whenReady().then(createWindow);

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

app.on('before-quit', () => {
  if (objServer) {
    objServer.close();
  }
});
