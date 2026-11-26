const STORAGE_KEY = "daily-task-manager-tasks";
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyMessage = document.querySelector("#empty-message");

let tasks = loadTasks();
renderTasks();

document.querySelector("#close-app").addEventListener("click", () => {
  window.widgetControls.close();
});

const checkUpdatesButton = document.querySelector("#check-updates");
const applyUpdateButton = document.querySelector("#apply-update");
const updateStatus = document.querySelector("#update-status");

checkUpdatesButton.addEventListener("click", async () => {
  checkUpdatesButton.disabled = true;
  updateStatus.textContent = "در حال بررسی نسخه‌های جدید…";
  const result = await window.widgetControls.checkForUpdates();
  if (result.state === "development") updateStatus.textContent = "بررسی آپدیت در نسخهٔ نصب‌شده فعال است.";
  else if (result.state === "error") updateStatus.textContent = "بررسی ناموفق بود. اتصال اینترنت را بررسی کن.";
});

applyUpdateButton.addEventListener("click", () => window.widgetControls.installUpdate());

window.widgetControls.onUpdateStatus(({ state, percent }) => {
  if (state === "checking") updateStatus.textContent = "در حال بررسی نسخه‌های جدید…";
  if (state === "available") updateStatus.textContent = "نسخهٔ جدید پیدا شد؛ در حال دریافت…";
  if (state === "downloading") updateStatus.textContent = `در حال دریافت به‌روزرسانی: ${toPersianDigits(percent)}٪`;
  if (state === "current") updateStatus.textContent = "برنامه به‌روز است.";
  if (state === "downloaded") {
    updateStatus.textContent = "به‌روزرسانی آمادهٔ نصب است.";
    applyUpdateButton.hidden = false;
  }
  if (state === "error") updateStatus.textContent = "بررسی یا دریافت به‌روزرسانی ناموفق بود.";
  checkUpdatesButton.disabled = false;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ id: makeId(), text, done: false });
  saveTasks();
  renderTasks();
  form.reset();
  input.focus();
});

function loadTasks() {
  try {
    const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(savedTasks) ? savedTasks : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderTasks() {
  list.replaceChildren();
  emptyMessage.hidden = tasks.length > 0;

  const remaining = tasks.filter((task) => !task.done).length;
  count.textContent = `${toPersianDigits(remaining)} کار باقی‌مانده`;

  for (const task of tasks) {
    const item = document.createElement("li");
    item.className = `task-item${task.done ? " done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.setAttribute("aria-label", `انجام شد: ${task.text}`);
    checkbox.addEventListener("change", () => {
      task.done = checkbox.checked;
      saveTasks();
      renderTasks();
    });

    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "حذف";
    deleteButton.setAttribute("aria-label", `حذف ${task.text}`);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
      saveTasks();
      renderTasks();
    });

    item.append(checkbox, text, deleteButton);
    list.append(item);
  }
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
}
