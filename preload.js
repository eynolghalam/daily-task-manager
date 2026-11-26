const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("widgetControls", {
  getVersion: () => ipcRenderer.sendSync("app:version"),
  close: () => ipcRenderer.send("widget:close"),
  checkForUpdates: () => ipcRenderer.invoke("updates:check"),
  installUpdate: () => ipcRenderer.send("updates:install"),
  addToCalendar: (task) => ipcRenderer.invoke("calendar:add", task),
  onUpdateStatus: (callback) => {
    ipcRenderer.on("updates:status", (_event, status) => callback(status));
  }
});
