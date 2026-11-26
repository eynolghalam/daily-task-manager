const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("widgetControls", {
  close: () => ipcRenderer.send("widget:close"),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  installUpdate: () => ipcRenderer.send("updates:install"),
  onUpdateStatus: (callback) => {
    ipcRenderer.on("updates:status", (_event, status) => callback(status));
  }
});
