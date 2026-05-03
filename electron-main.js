const fs = require('fs');
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
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
    title: 'Republic Resumes',
    icon: path.join(__dirname, 'public', 'favicon.svg'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
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

ipcMain.handle('save-resume-pdf', async () => {
  if (!objMainWindow) {
    return {
      canceled: true
    };
  }

  const objSaveResult = await dialog.showSaveDialog(objMainWindow, {
    title: 'Save Resume PDF',
    defaultPath: 'Republic-Resume.pdf',
    filters: [
      {
        name: 'PDF Documents',
        extensions: ['pdf']
      }
    ]
  });

  if (objSaveResult.canceled || !objSaveResult.filePath) {
    return {
      canceled: true
    };
  }

  const objPdfBuffer = await objMainWindow.webContents.printToPDF({
    displayHeaderFooter: false,
    pageSize: 'Letter',
    printBackground: true,
    margins: {
      marginType: 'default'
    }
  });

  fs.writeFileSync(objSaveResult.filePath, objPdfBuffer);

  return {
    canceled: false,
    filePath: objSaveResult.filePath
  };
});
