const STORAGE_KEY = "daily-task-manager-tasks";
const form = document.querySelector("#task-form");
const input = document.querySelector("#task-input");
const categoryInput = document.querySelector("#task-category");
const dateInput = document.querySelector("#task-date");
const categoryFilter = document.querySelector("#category-filter");
const chooseDateButton = document.querySelector("#choose-date");
const settingsDialog = document.querySelector("#settings-dialog");
const calendarDialog = document.querySelector("#calendar-dialog");
const categorySettingsList = document.querySelector("#category-settings-list");
const editDialog = document.querySelector("#edit-dialog");
const editForm = document.querySelector("#edit-task-form");
const editInput = document.querySelector("#edit-task-input");
const editCategory = document.querySelector("#edit-task-category");
const editPriority = document.querySelector("#edit-task-priority");
const editDate = document.querySelector("#edit-task-date");
const editDateButton = document.querySelector("#edit-choose-date");
const sortModeInput = document.querySelector("#sort-mode");
const calendarGrid = document.querySelector("#calendar-grid");
const calendarLabel = document.querySelector("#calendar-month-label");
const CATEGORIES_KEY = "daily-task-manager-categories";
const SETTINGS_KEY = "daily-task-manager-settings";
const DEFAULT_CATEGORIES = ["شخصی", "کار", "درس", "خانه"];
let categories = loadCategories();
let settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{"persianCalendar":true}');
let calendarCursor = new Date();
let editingTaskId = null;
let activeDateInput = dateInput;
let activeDateButton = chooseDateButton;
const list = document.querySelector("#task-list");
const count = document.querySelector("#task-count");
const emptyMessage = document.querySelector("#empty-message");

let tasks = loadTasks();
renderTasks();
categoryFilter.addEventListener("change", renderTasks);
renderCategoryOptions();
renderCategorySettings();
document.querySelector("#app-version").textContent = `v${window.widgetControls.getVersion()}`;
sortModeInput.value = settings.sortMode || "time";
sortModeInput.addEventListener("change", () => {
  settings.sortMode = sortModeInput.value;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  renderTasks();
});

document.querySelector("#open-settings").addEventListener("click", () => settingsDialog.showModal());
settingsDialog.querySelector(".dialog-close").addEventListener("click", () => settingsDialog.close());
document.querySelector("#persian-calendar-setting").checked = settings.persianCalendar !== false;
document.querySelector("#persian-calendar-setting").addEventListener("change", (event) => {
  settings.persianCalendar = event.target.checked;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  renderTasks();
});

document.querySelector("#category-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const field = document.querySelector("#new-category");
  const name = field.value.trim();
  if (!name || categories.includes(name)) return;
  categories.push(name);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  field.value = "";
  renderCategoryOptions();
  renderCategorySettings();
});

chooseDateButton.addEventListener("click", () => {
  showCalendarFor(dateInput, chooseDateButton);
});
editDateButton.addEventListener("click", () => showCalendarFor(editDate, editDateButton));

function showCalendarFor(inputField, triggerButton) {
  activeDateInput = inputField;
  activeDateButton = triggerButton;
  const value = inputField.value ? new Date(`${inputField.value}T12:00:00`) : new Date();
  calendarCursor = value;
  renderCalendar();
  calendarDialog.showModal();
}
document.querySelector("#close-calendar").addEventListener("click", () => calendarDialog.close());
document.querySelector("#previous-month").addEventListener("click", () => moveCalendarMonth(-1));
document.querySelector("#next-month").addEventListener("click", () => moveCalendarMonth(1));
document.querySelector("#clear-date").addEventListener("click", () => {
  activeDateInput.value = "";
  activeDateButton.textContent = "▦";
  activeDateButton.title = "انتخاب موعد";
  calendarDialog.close();
});
document.querySelector("#edit-clear-date").addEventListener("click", () => {
  editDate.value = "";
  editDateButton.textContent = "▦";
  editDateButton.title = "انتخاب موعد";
});
document.querySelector("#close-edit").addEventListener("click", () => editDialog.close());
editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const task = tasks.find((item) => item.id === editingTaskId);
  if (!task) return;
  task.text = editInput.value.trim();
  task.category = editCategory.value;
  task.priority = editPriority.value;
  task.date = editDate.value;
  saveTasks();
  renderTasks();
  editDialog.close();
});

function loadCategories() {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORIES_KEY) || "null");
    return Array.isArray(saved) ? [...new Set([...DEFAULT_CATEGORIES, ...saved])] : [...DEFAULT_CATEGORIES];
  } catch { return [...DEFAULT_CATEGORIES]; }
}

function renderCategoryOptions() {
  const selected = categoryInput.value || categories[0];
  categoryInput.replaceChildren(...categories.map((name) => new Option(name, name)));
  categoryInput.value = categories.includes(selected) ? selected : categories[0];
  const selectedEditCategory = editCategory.value;
  editCategory.replaceChildren(...categories.map((name) => new Option(name, name)));
  editCategory.value = categories.includes(selectedEditCategory) ? selectedEditCategory : categories[0];
  const currentFilter = categoryFilter.value || "همه";
  categoryFilter.replaceChildren(new Option("همهٔ دسته‌ها", "همه"), ...categories.map((name) => new Option(name, name)));
  categoryFilter.value = categories.includes(currentFilter) ? currentFilter : "همه";
}

function renderCategorySettings() {
  categorySettingsList.replaceChildren();
  for (const name of categories) {
    const chip = document.createElement("span");
    chip.className = "category-chip";
    chip.append(document.createTextNode(name));
    if (!DEFAULT_CATEGORIES.includes(name)) {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `حذف دستهٔ ${name}`);
      remove.addEventListener("click", () => {
        categories = categories.filter((category) => category !== name);
        tasks = tasks.map((task) => task.category === name ? { ...task, category: "شخصی" } : task);
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
        saveTasks();
        renderCategoryOptions();
        renderCategorySettings();
        renderTasks();
      });
      chip.append(remove);
    }
    categorySettingsList.append(chip);
  }
}

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
  else if (result.state === "error") {
    updateStatus.textContent = `خطا در بررسی: ${result.message || "علت نامشخص"}`;
    checkUpdatesButton.disabled = false;
  }
});

applyUpdateButton.addEventListener("click", () => window.widgetControls.installUpdate());

window.widgetControls.onUpdateStatus(({ state, percent, message }) => {
  if (state === "checking") updateStatus.textContent = "در حال بررسی نسخه‌های جدید…";
  if (state === "available") updateStatus.textContent = "نسخهٔ جدید پیدا شد؛ در حال دریافت…";
  if (state === "downloading") updateStatus.textContent = `در حال دریافت به‌روزرسانی: ${toPersianDigits(percent)}٪`;
  if (state === "current") updateStatus.textContent = "برنامه به‌روز است.";
  if (state === "downloaded") {
    updateStatus.textContent = "به‌روزرسانی آمادهٔ نصب است.";
    applyUpdateButton.hidden = false;
  }
  if (state === "error") updateStatus.textContent = `خطا در به‌روزرسانی: ${message || "علت نامشخص"}`;
  checkUpdatesButton.disabled = false;
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  tasks.push({ id: makeId(), text, done: false, category: categoryInput.value, date: dateInput.value, priority: document.querySelector("#task-priority").value });
  saveTasks();
  renderTasks();
  form.reset();
  chooseDateButton.textContent = "▦";
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
  const priorityRank = { high: 0, medium: 1, low: 2 };
  visibleTasks.sort((left, right) => {
    if (settings.sortMode === "category") return categories.indexOf(left.category || "شخصی") - categories.indexOf(right.category || "شخصی") || (left.date || "9999").localeCompare(right.date || "9999");
    if (settings.sortMode === "priority") return (priorityRank[left.priority || "medium"] - priorityRank[right.priority || "medium"]) || (left.date || "9999").localeCompare(right.date || "9999");
    return (left.date || "9999").localeCompare(right.date || "9999");
  });
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
    const priority = document.createElement("span");
    priority.className = `task-priority priority-${task.priority || "medium"}`;
    priority.textContent = { high: "اولویت بالا", medium: "عادی", low: "اولویت کم" }[task.priority || "medium"];
    details.append(priority);
    if (task.date) {
      const date = document.createElement("span");
      date.textContent = `موعد: ${formatTaskDate(task.date)}`;
      details.append(date);
      const calendarButton = document.createElement("button");
      calendarButton.className = "calendar-button";
      calendarButton.type = "button";
      calendarButton.textContent = "▦";
      calendarButton.setAttribute("aria-label", "افزودن به تقویم");
      calendarButton.title = "افزودن به تقویم";
      calendarButton.addEventListener("click", async () => {
        const result = await window.widgetControls.addToCalendar({ text: task.text, date: task.date, category: task.category });
        if (result.ok) updateStatus.textContent = "رویداد تقویم آماده و باز شد.";
        else if (!result.canceled) updateStatus.textContent = result.message || "ساخت رویداد تقویم ناموفق بود.";
      });
      details.append(calendarButton);
    }
    body.append(details);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const editButton = document.createElement("button");
    editButton.className = "edit-button";
    editButton.type = "button";
    editButton.textContent = "✎";
    editButton.title = "ویرایش کار";
    editButton.setAttribute("aria-label", `ویرایش ${task.text}`);
    editButton.addEventListener("click", () => openEditDialog(task));

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "🗑";
    deleteButton.title = "حذف کار";
    deleteButton.setAttribute("aria-label", `حذف ${task.text}`);
    deleteButton.addEventListener("click", () => {
      tasks = tasks.filter((currentTask) => currentTask.id !== task.id);
      saveTasks();
      renderTasks();
    });

    actions.append(editButton, deleteButton);
    item.append(checkbox, body, actions);
    list.append(item);
  }
}

function openEditDialog(task) {
  editingTaskId = task.id;
  editInput.value = task.text;
  editCategory.value = task.category || "شخصی";
  editPriority.value = task.priority || "medium";
  editDate.value = task.date || "";
  editDateButton.textContent = "▦";
  editDateButton.title = task.date ? formatTaskDate(task.date) : "انتخاب موعد";
  editDialog.showModal();
}

function toPersianDigits(value) {
  return String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[digit]);
}

function formatTaskDate(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  const calendar = settings.persianCalendar === false ? "gregory" : "persian";
  return new Intl.DateTimeFormat(`fa-IR-u-ca-${calendar}`, { year: "numeric", month: "long", day: "numeric" }).format(date);
}

function persianParts(date) {
  const parts = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", { year: "numeric", month: "numeric", day: "numeric" }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function renderCalendar() {
  const currentParts = persianParts(calendarCursor);
  const persianLabel = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { year: "numeric", month: "long" }).format(calendarCursor);
  calendarLabel.textContent = persianLabel;
  calendarGrid.replaceChildren();

  const weekdayNames = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
  for (const name of weekdayNames) {
    const weekday = document.createElement("span");
    weekday.className = "weekday";
    weekday.textContent = name;
    calendarGrid.append(weekday);
  }

  const monthDates = [];
  const scan = new Date(calendarCursor);
  scan.setDate(scan.getDate() - 20);
  for (let i = 0; i < 65; i += 1) {
    const date = new Date(scan);
    const parts = persianParts(date);
    if (parts.year === currentParts.year && parts.month === currentParts.month) monthDates.push(date);
    scan.setDate(scan.getDate() + 1);
  }
  if (!monthDates.length) return;
  const firstOffset = (monthDates[0].getDay() + 1) % 7;
  for (let i = 0; i < firstOffset; i += 1) {
    const blank = document.createElement("span");
    blank.className = "blank";
    calendarGrid.append(blank);
  }
  for (const date of monthDates) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = toPersianDigits(persianParts(date).day);
    const isoDate = toIsoDate(date);
    if (activeDateInput.value === isoDate) button.classList.add("selected");
    button.addEventListener("click", () => {
      activeDateInput.value = isoDate;
      activeDateButton.textContent = "▦";
      activeDateButton.title = formatTaskDate(isoDate);
      calendarDialog.close();
    });
    calendarGrid.append(button);
  }
}

function moveCalendarMonth(direction) {
  let targetMonth = persianParts(calendarCursor).month + direction;
  let targetYear = persianParts(calendarCursor).year;
  if (targetMonth < 1) { targetMonth = 12; targetYear -= 1; }
  if (targetMonth > 12) { targetMonth = 1; targetYear += 1; }
  const scan = new Date(calendarCursor);
  scan.setDate(scan.getDate() - 200);
  for (let i = 0; i < 500; i += 1) {
    const parts = persianParts(scan);
    if (parts.year === targetYear && parts.month === targetMonth && parts.day === 15) {
      calendarCursor = scan;
      renderCalendar();
      return;
    }
    scan.setDate(scan.getDate() + 1);
  }
}

function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
