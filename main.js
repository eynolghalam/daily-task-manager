const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const { autoUpdater } = require("electron-updater");

function createWidget() {
  const widget = new BrowserWindow({
    width: 430,
    height: 650,
    minWidth: 360,
    minHeight: 420,
    title: "مدیریت کارهای روزانه",
    frame: false,
    alwaysOnTop: true,
    resizable: true,
    autoHideMenuBar: true,
    backgroundColor: "#f4f7f5",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  widget.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  ipcMain.on("widget:close", (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
  createWidget();
  // Check GitHub Releases for a newer published version when installed.
  if (app.isPackaged) autoUpdater.checkForUpdatesAndNotify();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWidget();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
