const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("widgetControls", {
  close: () => ipcRenderer.send("widget:close")
});
