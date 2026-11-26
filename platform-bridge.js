// Web/mobile fallback. Electron supplies the same API through preload.js.
window.isAndroidApp = Boolean(window.Capacitor);
if (window.isAndroidApp) document.documentElement.classList.add("android-app");

if (!window.widgetControls) {
  window.widgetControls = {
    getVersion: () => window.APP_VERSION || "mobile",
    close: () => {},
    checkForUpdates: async () => ({ state: "unsupported" }),
    installUpdate: () => {},
    onUpdateStatus: () => {},
    async addToCalendar(task) {
      const day = (task.date || "").replaceAll("-", "");
      if (!day) return { ok: false, message: "برای افزودن به تقویم، ابتدا موعد کار را تعیین کن." };
      const escapeText = (text) => String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
      const content = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Daily Task Manager//FA", "BEGIN:VEVENT", `UID:${Date.now()}@daily-task-manager`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`, `DTSTART;VALUE=DATE:${day}`, `SUMMARY:${escapeText(task.text)}`, `CATEGORIES:${escapeText(task.category || "شخصی")}`, "END:VEVENT", "END:VCALENDAR", ""].join("\r\n");
      const file = new File([content], "daily-task.ics", { type: "text/calendar" });
      try {
        if (navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: task.text });
        else {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, canceled: error.name === "AbortError", message: error.message };
      }
    }
  };
}
