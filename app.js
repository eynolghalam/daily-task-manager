const STORAGE_KEY = "daily-task-manager-tasks";
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const categoryInput = document.querySelector("#task-category");
const dateInput = document.querySelector("#task-date");
const categoryFilter = document.querySelector("#category-filter");
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyMessage = document.querySelector("#empty-message");

let tasks = loadTasks();
renderTasks();
categoryFilter.addEventListener("change", renderTasks);

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

  tasks.push({ id: makeId(), text, done: false, category: categoryInput.value, date: dateInput.value });
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
  const visibleTasks = tasks.filter((task) => categoryFilter.value === "همه" || (task.category || "شخصی") === categoryFilter.value);
  emptyMessage.hidden = visibleTasks.length > 0;

  const remaining = tasks.filter((task) => !task.done).length;
  count.textContent = `${toPersianDigits(remaining)} کار باقی‌مانده`;

  for (const task of visibleTasks) {
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

    const body = document.createElement("div");
    body.className = "task-body";
    const text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;
    body.append(text);

    const details = document.createElement("div");
    details.className = "task-details";
    const category = document.createElement("span");
    category.className = "task-category";
    category.textContent = task.category || "شخصی";
    details.append(category);
    if (task.date) {
      const date = document.createElement("span");
      date.textContent = `موعد: ${toPersianDigits(task.date)}`;
      details.append(date);
      const calendarButton = document.createElement("button");
      calendarButton.className = "calendar-button";
      calendarButton.type = "button";
      calendarButton.textContent = "افزودن به تقویم";
      calendarButton.addEventListener("click", async () => {
        const result = await window.widgetControls.addToCalendar({ text: task.text, date: task.date, category: task.category });
        if (result.ok) updateStatus.textContent = "رویداد تقویم آماده و باز شد.";
        else if (!result.canceled) updateStatus.textContent = result.message || "ساخت رویداد تقویم ناموفق بود.";
      });
      details.append(calendarButton);
    }
    body.append(details);

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

    item.append(checkbox, body, deleteButton);
    list.append(item);
  }
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
}
