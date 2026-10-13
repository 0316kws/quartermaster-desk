const STORAGE_KEY = "quartermaster-desk.tasks.v1";

const state = {
  tasks: loadTasks(),
  view: "all",
  query: "",
  category: "all",
  priority: "all",
};

const els = {
  currentDate: document.querySelector("#currentDate"),
  viewTitle: document.querySelector("#viewTitle"),
  listHeading: document.querySelector("#listHeading"),
  taskList: document.querySelector("#taskList"),
  emptyState: document.querySelector("#emptyState"),
  emptyTitle: document.querySelector("#emptyTitle"),
  emptyMessage: document.querySelector("#emptyMessage"),
  addTaskButton: document.querySelector("#addTaskButton"),
  emptyAddButton: document.querySelector("#emptyAddButton"),
  clearCompletedButton: document.querySelector("#clearCompletedButton"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  priorityFilter: document.querySelector("#priorityFilter"),
  openStat: document.querySelector("#openStat"),
  openDetail: document.querySelector("#openDetail"),
  todayStat: document.querySelector("#todayStat"),
  todayDetail: document.querySelector("#todayDetail"),
  progressStat: document.querySelector("#progressStat"),
  progressBar: document.querySelector("#progressBar"),
  taskDialog: document.querySelector("#taskDialog"),
  taskForm: document.querySelector("#taskForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  taskId: document.querySelector("#taskId"),
  taskTitle: document.querySelector("#taskTitle"),
  taskCategory: document.querySelector("#taskCategory"),
  taskDue: document.querySelector("#taskDue"),
  taskNotes: document.querySelector("#taskNotes"),
  closeDialogButton: document.querySelector("#closeDialogButton"),
  cancelDialogButton: document.querySelector("#cancelDialogButton"),
  moreButton: document.querySelector("#moreButton"),
  dataMenu: document.querySelector("#dataMenu"),
  exportButton: document.querySelector("#exportButton"),
  importButton: document.querySelector("#importButton"),
  importInput: document.querySelector("#importInput"),
  toast: document.querySelector("#toast"),
};

const today = () => new Date().toLocaleDateString("en-CA");

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const value = new Date(`${dateString}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(value);
}

function dueState(task) {
  if (!task.due || task.completed) return "";
  if (task.due < today()) return "overdue";
  if (task.due === today()) return "today";
  return "";
}

function dueLabel(task) {
  const status = dueState(task);
  if (status === "overdue") return `Overdue · ${formatDate(task.due)}`;
  if (status === "today") return "Due today";
  return task.due ? `Due ${formatDate(task.due)}` : "No due date";
}

function matchesView(task) {
  if (state.view === "completed") return task.completed;
  if (task.completed) return false;
  if (state.view === "today") return task.due && task.due <= today();
  if (state.view === "upcoming") return task.due && task.due > today();
  return true;
}

function filteredTasks() {
  const priorityRank = { high: 0, medium: 1, low: 2 };
  const query = state.query.trim().toLowerCase();
  return state.tasks
    .filter(matchesView)
    .filter((task) => state.category === "all" || task.category === state.category)
    .filter((task) => state.priority === "all" || task.priority === state.priority)
    .filter((task) => !query || `${task.title} ${task.notes || ""} ${task.category}`.toLowerCase().includes(query))
    .sort((a, b) => {
      if (state.view === "completed") return (b.completedAt || "").localeCompare(a.completedAt || "");
      if (!a.due && b.due) return 1;
      if (a.due && !b.due) return -1;
      if (a.due !== b.due) return (a.due || "").localeCompare(b.due || "");
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
}

function taskMarkup(task) {
  const dateClass = dueState(task);
  const noteTitle = task.notes ? ` title="${escapeHTML(task.notes)}"` : "";
  return `
    <article class="task-row priority-${task.priority} ${task.completed ? "is-complete" : ""}" data-id="${task.id}"${noteTitle}>
      <label class="task-check" aria-label="Mark ${escapeHTML(task.title)} ${task.completed ? "open" : "complete"}">
        <input type="checkbox" data-action="toggle" ${task.completed ? "checked" : ""} />
        <span aria-hidden="true">✓</span>
      </label>
      <div class="task-copy">
        <p class="task-name">${escapeHTML(task.title)}</p>
        <div class="task-meta">
          <span class="category-pill">${escapeHTML(task.category)}</span>
          <span class="priority-pill ${task.priority}">${escapeHTML(task.priority)}</span>
          ${task.notes ? "<span>Has notes</span>" : ""}
        </div>
      </div>
      <span class="due-date ${dateClass}">${dueLabel(task)}</span>
      <div class="task-actions">
        <button class="task-action" data-action="edit" type="button" aria-label="Edit ${escapeHTML(task.title)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.7 4 4-.7L18 8.6 14.4 5zM12.8 6.6l3.6 3.6" /></svg>
        </button>
        <button class="task-action delete" data-action="delete" type="button" aria-label="Delete ${escapeHTML(task.title)}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M8 10v7M12 10v7M16 10v7M6.5 7l.7 14h9.6l.7-14" /></svg>
        </button>
      </div>
    </article>`;
}

function render() {
  const visible = filteredTasks();
  els.taskList.innerHTML = visible.map(taskMarkup).join("");
  els.emptyState.hidden = visible.length > 0;

  const viewLabels = { all: "Open tasks", today: "Due today", upcoming: "Upcoming", completed: "Completed" };
  els.listHeading.textContent = viewLabels[state.view];
  els.emptyTitle.textContent = state.query || state.category !== "all" || state.priority !== "all" ? "No match found" : state.view === "completed" ? "Nothing completed yet" : "All clear";
  els.emptyMessage.textContent = state.query || state.category !== "all" || state.priority !== "all" ? "Try adjusting your search or filters." : "There are no tasks in this view.";
  els.emptyAddButton.hidden = state.view === "completed" || Boolean(state.query) || state.category !== "all" || state.priority !== "all";

  const open = state.tasks.filter((task) => !task.completed);
  const completed = state.tasks.filter((task) => task.completed);
  const dueNow = open.filter((task) => task.due && task.due <= today());
  const overdue = open.filter((task) => task.due && task.due < today());
  const total = state.tasks.length;
  const progress = total ? Math.round((completed.length / total) * 100) : 0;

  els.openStat.textContent = open.length;
  els.openDetail.textContent = open.length ? `${open.filter((task) => task.priority === "high").length} high priority` : "All clear";
  els.todayStat.textContent = dueNow.length;
  els.todayDetail.textContent = overdue.length ? `${overdue.length} overdue` : "Nothing overdue";
  els.progressStat.textContent = `${progress}%`;
  els.progressBar.style.width = `${progress}%`;
  els.clearCompletedButton.hidden = completed.length === 0;

  const counts = {
    all: open.length,
    today: dueNow.length,
    upcoming: open.filter((task) => task.due && task.due > today()).length,
    completed: completed.length,
  };
  Object.entries(counts).forEach(([key, value]) => {
    document.querySelector(`[data-count="${key}"]`).textContent = value;
  });
}

function openTaskDialog(task = null) {
  els.taskForm.reset();
  els.taskId.value = task?.id || "";
  els.dialogTitle.textContent = task ? "Edit task" : "Add a task";
  els.taskTitle.value = task?.title || "";
  els.taskCategory.value = task?.category || "Inventory";
  els.taskDue.value = task?.due || today();
  els.taskNotes.value = task?.notes || "";
  const selectedPriority = els.taskForm.querySelector(`[name="priority"][value="${task?.priority || "medium"}"]`);
  if (selectedPriority) selectedPriority.checked = true;
  els.taskDialog.showModal();
  requestAnimationFrame(() => els.taskTitle.focus());
}

function closeTaskDialog() {
  els.taskDialog.close();
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function saveTask(event) {
  event.preventDefault();
  const title = els.taskTitle.value.trim();
  if (!title) return;
  const id = els.taskId.value;
  const taskData = {
    title,
    category: els.taskCategory.value,
    due: els.taskDue.value,
    priority: new FormData(els.taskForm).get("priority"),
    notes: els.taskNotes.value.trim(),
  };

  if (id) {
    const index = state.tasks.findIndex((task) => task.id === id);
    if (index !== -1) state.tasks[index] = { ...state.tasks[index], ...taskData };
    showToast("Task updated");
  } else {
    state.tasks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    showToast("Task added");
  }
  saveTasks();
  closeTaskDialog();
  render();
}

function handleTaskAction(event) {
  const actionElement = event.target.closest("[data-action]");
  const row = event.target.closest("[data-id]");
  if (!actionElement || !row) return;
  const task = state.tasks.find((item) => item.id === row.dataset.id);
  if (!task) return;
  const action = actionElement.dataset.action;

  if (action === "toggle") {
    task.completed = actionElement.checked;
    task.completedAt = task.completed ? new Date().toISOString() : null;
    saveTasks();
    render();
    showToast(task.completed ? "Task completed" : "Task reopened");
  }
  if (action === "edit") openTaskDialog(task);
  if (action === "delete") {
    state.tasks = state.tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
    showToast("Task deleted");
  }
}

function setView(view) {
  state.view = view;
  document.querySelectorAll(".nav-item").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  render();
}

function exportTasks() {
  const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tasks: state.tasks }, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `quartermaster-tasks-${today()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
  closeDataMenu();
  showToast("Backup exported");
}

async function importTasks(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const tasks = Array.isArray(parsed) ? parsed : parsed.tasks;
    if (!Array.isArray(tasks)) throw new Error("Invalid backup");
    state.tasks = tasks
      .filter((task) => task && typeof task.title === "string")
      .map((task) => ({
        id: task.id || `${Date.now()}-${Math.random()}`,
        title: task.title.slice(0, 120),
        category: task.category || "Inventory",
        priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
        due: task.due || "",
        notes: String(task.notes || "").slice(0, 500),
        completed: Boolean(task.completed),
        createdAt: task.createdAt || new Date().toISOString(),
        completedAt: task.completedAt || null,
      }));
    saveTasks();
    render();
    showToast(`${state.tasks.length} tasks imported`);
  } catch {
    showToast("That backup could not be imported");
  } finally {
    els.importInput.value = "";
  }
}

function closeDataMenu() {
  els.dataMenu.hidden = true;
  els.moreButton.setAttribute("aria-expanded", "false");
}

function setHeader() {
  const now = new Date();
  els.currentDate.textContent = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now);
  const hour = now.getHours();
  els.viewTitle.textContent = hour < 12 ? "Ready for the day." : hour < 18 ? "Keep things moving." : "Close out the day.";
}

document.querySelectorAll(".nav-item").forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
els.addTaskButton.addEventListener("click", () => openTaskDialog());
els.emptyAddButton.addEventListener("click", () => openTaskDialog());
els.closeDialogButton.addEventListener("click", closeTaskDialog);
els.cancelDialogButton.addEventListener("click", closeTaskDialog);
els.taskForm.addEventListener("submit", saveTask);
els.taskList.addEventListener("click", handleTaskAction);
els.taskList.addEventListener("change", handleTaskAction);
els.searchInput.addEventListener("input", (event) => { state.query = event.target.value; render(); });
els.categoryFilter.addEventListener("change", (event) => { state.category = event.target.value; render(); });
els.priorityFilter.addEventListener("change", (event) => { state.priority = event.target.value; render(); });
els.clearCompletedButton.addEventListener("click", () => {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  render();
  showToast("Completed tasks cleared");
});
els.moreButton.addEventListener("click", () => {
  const willOpen = els.dataMenu.hidden;
  els.dataMenu.hidden = !willOpen;
  els.moreButton.setAttribute("aria-expanded", String(willOpen));
});
els.exportButton.addEventListener("click", exportTasks);
els.importButton.addEventListener("click", () => { closeDataMenu(); els.importInput.click(); });
els.importInput.addEventListener("change", importTasks);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".menu-wrap")) closeDataMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "/" && !event.metaKey && !event.ctrlKey && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    els.searchInput.focus();
  }
  if (event.key.toLowerCase() === "n" && !event.metaKey && !event.ctrlKey && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    openTaskDialog();
  }
  if (event.key === "Escape") closeDataMenu();
});
els.taskDialog.addEventListener("click", (event) => {
  if (event.target === els.taskDialog) closeTaskDialog();
});

setHeader();
render();
