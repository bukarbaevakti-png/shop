const STORAGE_KEY = "focusflow-tasks-v1";

const state = {
  tasks: loadTasks(),
  filter: "all",
  sortBy: "date",
  searchTerm: "",
  editingId: null,
  draggedId: null,
};

const refs = {
  form: document.getElementById("taskForm"),
  titleInput: document.getElementById("taskTitle"),
  categorySelect: document.getElementById("taskCategory"),
  prioritySelect: document.getElementById("taskPriority"),
  dueDateInput: document.getElementById("taskDueDate"),
  submitButton: document.querySelector(".primary-btn"),
  formHeading: document.getElementById("formHeading"),
  cancelEditButton: document.getElementById("cancelEdit"),
  searchInput: document.getElementById("searchInput"),
  filterGroup: document.getElementById("filterGroup"),
  sortSelect: document.getElementById("sortSelect"),
  taskList: document.getElementById("taskList"),
  emptyState: document.getElementById("emptyState"),
  progressFill: document.getElementById("progressFill"),
  progressLabel: document.getElementById("progressLabel"),
  totalTasks: document.getElementById("totalTasks"),
  completedTasks: document.getElementById("completedTasks"),
  pendingTasks: document.getElementById("pendingTasks"),
  toast: document.getElementById("toast"),
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  bindEvents();
  render();
}

function bindEvents() {
  refs.form.addEventListener("submit", handleSubmit);
  refs.cancelEditButton.addEventListener("click", resetForm);
  refs.searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim().toLowerCase();
    render();
  });

  refs.filterGroup.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    updateFilterButtons();
    render();
  });

  refs.sortSelect.addEventListener("change", (event) => {
    state.sortBy = event.target.value;
    render();
  });

  refs.taskList.addEventListener("click", handleTaskListClick);
  refs.taskList.addEventListener("change", handleTaskListChange);
  refs.taskList.addEventListener("dragstart", handleDragStart);
  refs.taskList.addEventListener("dragover", handleDragOver);
  refs.taskList.addEventListener("dragleave", handleDragLeave);
  refs.taskList.addEventListener("drop", handleDrop);
  refs.taskList.addEventListener("dragend", handleDragEnd);

  refs.titleInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit(event);
    }
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const title = refs.titleInput.value.trim();
  if (!title) {
    refs.titleInput.focus();
    showToast("Please enter a task title.", "error");
    return;
  }

  const taskData = {
    title,
    category: refs.categorySelect.value,
    priority: refs.prioritySelect.value,
    dueDate: refs.dueDateInput.value,
  };

  if (state.editingId) {
    const existingTask = state.tasks.find((task) => task.id === state.editingId);
    if (existingTask) {
      existingTask.title = taskData.title;
      existingTask.category = taskData.category;
      existingTask.priority = taskData.priority;
      existingTask.dueDate = taskData.dueDate;
      existingTask.updatedAt = Date.now();
      showToast("Task updated successfully.", "success");
    }
  } else {
    state.tasks.unshift({
      id: Date.now().toString(),
      ...taskData,
      completed: false,
      createdAt: Date.now(),
    });
    showToast("Task added successfully.", "success");
  }

  saveTasks();
  resetForm();
  render();
}

function resetForm() {
  refs.form.reset();
  state.editingId = null;
  refs.formHeading.textContent = "Add a new task";
  refs.submitButton.textContent = "Add Task";
  refs.cancelEditButton.hidden = true;
  refs.titleInput.focus();
}

function startEditing(task) {
  state.editingId = task.id;
  refs.titleInput.value = task.title;
  refs.categorySelect.value = task.category;
  refs.prioritySelect.value = task.priority;
  refs.dueDateInput.value = task.dueDate || "";
  refs.formHeading.textContent = "Edit task";
  refs.submitButton.textContent = "Save Task";
  refs.cancelEditButton.hidden = false;
  refs.titleInput.focus();
}

function toggleComplete(taskId, completed = null) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.completed = completed ?? !task.completed;
  task.updatedAt = Date.now();
  saveTasks();
  render();
  showToast(task.completed ? "Task completed." : "Task restored.", "success");
}

function deleteTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  const confirmed = window.confirm(`Delete "${task.title}"?`);
  if (!confirmed) return;

  state.tasks = state.tasks.filter((item) => item.id !== taskId);
  if (state.editingId === taskId) {
    resetForm();
  }
  saveTasks();
  render();
  showToast("Task deleted.", "success");
}

function handleTaskListClick(event) {
  const actionButton = event.target.closest("button[data-action]");
  if (!actionButton) return;

  const taskId = actionButton.dataset.id;
  const action = actionButton.dataset.action;

  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  if (action === "edit") {
    startEditing(task);
  } else if (action === "delete") {
    deleteTask(taskId);
  } else if (action === "undo") {
    toggleComplete(taskId, false);
  }
}

function handleTaskListChange(event) {
  const checkbox = event.target.closest("input[data-task-checkbox]");
  if (!checkbox) return;
  toggleComplete(checkbox.dataset.id);
}

function handleDragStart(event) {
  const item = event.target.closest(".task-item");
  if (!item) return;
  state.draggedId = item.dataset.id;
  item.classList.add("dragging");
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", state.draggedId);
}

function handleDragOver(event) {
  const item = event.target.closest(".task-item");
  if (!item || item.dataset.id === state.draggedId) return;
  event.preventDefault();
  item.classList.add("drop-target");
}

function handleDragLeave(event) {
  const item = event.target.closest(".task-item");
  if (item) item.classList.remove("drop-target");
}

function handleDrop(event) {
  const item = event.target.closest(".task-item");
  if (!item || !state.draggedId) return;
  event.preventDefault();

  const fromIndex = state.tasks.findIndex((task) => task.id === state.draggedId);
  const toIndex = state.tasks.findIndex((task) => task.id === item.dataset.id);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    resetDragState();
    return;
  }

  const [movedTask] = state.tasks.splice(fromIndex, 1);
  state.tasks.splice(toIndex, 0, movedTask);
  saveTasks();
  render();
  showToast("Task reordered.", "success");
  resetDragState();
}

function handleDragEnd() {
  resetDragState();
}

function resetDragState() {
  document.querySelectorAll(".task-item").forEach((item) => {
    item.classList.remove("dragging", "drop-target");
  });
  state.draggedId = null;
}

function render() {
  const filteredTasks = getFilteredTasks();
  const completedCount = state.tasks.filter((task) => task.completed).length;
  const totalCount = state.tasks.length;
  const pendingCount = totalCount - completedCount;
  const completionPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  refs.totalTasks.textContent = totalCount;
  refs.completedTasks.textContent = completedCount;
  refs.pendingTasks.textContent = pendingCount;
  refs.progressFill.style.width = `${completionPercent}%`;
  refs.progressLabel.textContent = `${completionPercent}% complete`;

  updateFilterButtons();

  if (filteredTasks.length === 0) {
    refs.emptyState.hidden = false;
    refs.taskList.innerHTML = "";
    return;
  }

  refs.emptyState.hidden = true;
  refs.taskList.innerHTML = filteredTasks.map(renderTaskItem).join("");
}

function getFilteredTasks() {
  const query = state.searchTerm;

  return [...state.tasks]
    .filter((task) => {
      const matchedSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.category.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query);

      if (!matchedSearch) return false;

      if (state.filter === "active" && task.completed) return false;
      if (state.filter === "completed" && !task.completed) return false;
      if (state.filter === "high" && task.priority !== "High") return false;

      return true;
    })
    .sort(sortTasks);
}

function sortTasks(a, b) {
  if (state.sortBy === "priority") {
    const priorityRank = { High: 0, Medium: 1, Low: 2 };
    return priorityRank[a.priority] - priorityRank[b.priority] || b.createdAt - a.createdAt;
  }

  if (state.sortBy === "alphabetical") {
    return a.title.localeCompare(b.title);
  }

  const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  return dateA - dateB || b.createdAt - a.createdAt;
}

function renderTaskItem(task) {
  const dueText = task.dueDate ? formatDate(task.dueDate) : "No due date";

  return `
    <article class="task-item" draggable="true" data-id="${task.id}">
      <div class="task-main">
        <input
          class="task-check"
          type="checkbox"
          data-task-checkbox
          data-id="${task.id}"
          ${task.completed ? "checked" : ""}
          aria-label="Mark task as completed"
        />
        <div class="task-body">
          <div class="task-title-row">
            <span class="task-title ${task.completed ? "completed" : ""}">${escapeHtml(task.title)}</span>
            <span class="meta-chip priority-chip ${task.priority.toLowerCase()}">${task.priority}</span>
          </div>
          <div class="meta-row">
            <span class="meta-chip">📁 ${escapeHtml(task.category)}</span>
            <span class="meta-chip">📅 ${escapeHtml(dueText)}</span>
          </div>
        </div>
      </div>

      <div class="task-actions">
        ${task.completed ? `<button class="icon-btn undo" type="button" data-action="undo" data-id="${task.id}" title="Undo">↺</button>` : ""}
        <button class="icon-btn edit" type="button" data-action="edit" data-id="${task.id}" title="Edit">✎</button>
        <button class="icon-btn delete" type="button" data-action="delete" data-id="${task.id}" title="Delete">🗑</button>
      </div>
    </article>
  `;
}

function updateFilterButtons() {
  const buttons = refs.filterGroup.querySelectorAll("button[data-filter]");
  buttons.forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === state.filter);
  });
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Unable to load tasks", error);
    return [];
  }
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const parsed = new Date(`${dateString}T00:00:00`);
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function showToast(message, type = "success") {
  refs.toast.textContent = message;
  refs.toast.className = `toast show ${type}`;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    refs.toast.className = "toast";
  }, 2200);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
