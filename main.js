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
  ipcMain.handle("updates:check", async () => {
    if (!app.isPackaged) return { state: "development" };
    try {
      await autoUpdater.checkForUpdates();
      return { state: "checking" };
    } catch (error) {
      return { state: "error", message: error.message };
    }
  });
  ipcMain.on("updates:install", () => autoUpdater.quitAndInstall());

  for (const [eventName, state] of [
    ["checking-for-update", "checking"],
    ["update-available", "available"],
    ["update-not-available", "current"],
    ["update-downloaded", "downloaded"]
  ]) {
    autoUpdater.on(eventName, () => {
      for (const widget of BrowserWindow.getAllWindows()) {
        widget.webContents.send("updates:status", { state });
      }
    });
  }
  autoUpdater.on("download-progress", (progress) => {
    for (const widget of BrowserWindow.getAllWindows()) {
      widget.webContents.send("updates:status", { state: "downloading", percent: Math.floor(progress.percent) });
    }
  });
  autoUpdater.on("error", (error) => {
    for (const widget of BrowserWindow.getAllWindows()) {
      widget.webContents.send("updates:status", { state: "error", message: error.message });
    }
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
