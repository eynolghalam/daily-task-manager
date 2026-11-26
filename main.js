const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs/promises");
const { dialog, shell } = require("electron");
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
  ipcMain.handle("calendar:add", async (_event, task) => {
    if (!task?.text || !/^\d{4}-\d{2}-\d{2}$/.test(task.date || "")) {
      return { ok: false, message: "برای افزودن به تقویم، ابتدا برای کار موعد تعیین کن." };
    }
    const cleanText = String(task.text).replace(/[\\,;]/g, "\\$&").replace(/\r?\n/g, "\\n");
    const date = task.date.replaceAll("-", "");
    const ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Daily Task Manager//FA", "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT", `UID:${Date.now()}-${Math.random().toString(16).slice(2)}@daily-task-manager`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTSTART;VALUE=DATE:${date}`, `SUMMARY:${cleanText}`,
      `CATEGORIES:${String(task.category || "شخصی").replace(/[\\,;]/g, "\\$&")}`,
      "END:VEVENT", "END:VCALENDAR", ""
    ].join("\r\n");
    const result = await dialog.showSaveDialog({
      title: "افزودن کار به تقویم ویندوز",
      defaultPath: `${String(task.text).replace(/[<>:"/\\|?*]/g, "-")}.ics`,
      filters: [{ name: "Calendar event", extensions: ["ics"] }]
    });
    if (result.canceled || !result.filePath) return { ok: false, canceled: true };
    await fs.writeFile(result.filePath, ics, "utf8");
    const openError = await shell.openPath(result.filePath);
    return openError ? { ok: false, message: openError } : { ok: true };
  });
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
