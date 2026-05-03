const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('resumeForgeElectron', {
  saveResumePdf: () => ipcRenderer.invoke('save-resume-pdf')
});
