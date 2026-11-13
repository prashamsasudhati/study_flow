(function () {
  "use strict";
  const api = window.StudyFlow;
  const form = document.getElementById("task-form");
  const body = document.getElementById("tasks-body");
  const dialog = document.getElementById("edit-dialog");
  const editForm = document.getElementById("edit-form");
  const titleField = document.getElementById("task-title");
  const startField = document.getElementById("task-start-date");
  const deadlineField = document.getElementById("task-deadline");
  let busy = false;

  function render() {
    const search = document.getElementById("task-search").value.trim().toLowerCase();
    const status = document.getElementById("status-filter").value;
    const priority = document.getElementById("priority-filter").value;
    const sort = document.getElementById("sort-order").value;
    const items = api.tasks.filter((task) => {
      const matches = `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(search);
      const taskStatus = task.status !== "Completed" && task.deadline < api.today() ? "Overdue" : task.status;
      return matches && (status === "all" || status === taskStatus) &&
        (priority === "all" || task.priority === priority);
    });
    items.sort((a, b) => sort === "created" ? new Date(b.createdAt) - new Date(a.createdAt) :
      (sort === "desc" ? b.deadline.localeCompare(a.deadline) : a.deadline.localeCompare(b.deadline)));
    body.innerHTML = items.map((task) => {
      const overdue = task.status !== "Completed" && task.deadline < api.today();
      const taskStatus = overdue ? "Overdue" : task.status;
      const statusClass = overdue ? "status-overdue" : api.statusClass(task);
      return `<tr><td><span class="task-name">${api.escapeHtml(task.title)}</span><span class="task-description">${api.escapeHtml(task.description || "No description")}</span></td><td><span class="category-pill">${api.escapeHtml(task.category)}</span></td><td><span class="priority-pill priority-${task.priority.toLowerCase()}">${api.escapeHtml(task.priority)}</span></td><td>${api.formatDate(task.deadline, { month: "short", day: "numeric", year: "numeric" })}</td><td><button class="status-pill ${statusClass}" data-toggle-status="${api.escapeHtml(task.id)}" title="Click to cycle task status">${api.escapeHtml(taskStatus)} ▾</button></td><td><div class="table-actions"><button class="mini-button" data-edit="${api.escapeHtml(task.id)}" aria-label="Edit ${api.escapeHtml(task.title)}" title="Edit">✎</button><button class="mini-button" data-delete="${api.escapeHtml(task.id)}" aria-label="Delete ${api.escapeHtml(task.title)}" title="Delete">×</button></div></td></tr>`;
    }).join("");
    document.getElementById("tasks-empty").hidden = items.length > 0;
  }

  function setBusy(value) {
    busy = value;
    form.querySelector('[type="submit"]').disabled = value;
    editForm.querySelector('[type="submit"]').disabled = value;
  }

  function fillEditForm(task) {
    Object.entries(task).forEach(([key, value]) => {
      const field = editForm.elements.namedItem(key);
      if (field && key !== "createdAt" && key !== "updatedAt") field.value = value || "";
    });
    dialog.showModal();
  }

  function validateDates(startDate, deadline) {
    if (startDate && deadline && deadline < startDate) {
      api.showToast("The deadline must be on or after the start date.", true);
      return false;
    }
    return true;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form).entries());
    if (!validateDates(values.startDate, values.deadline)) return;
    setBusy(true);
    try {
      await api.createTask(values);
      form.reset();
      startField.value = api.today();
      deadlineField.min = api.today();
      titleField.focus();
      api.showToast("Task added.");
    } catch (error) {
      api.showToast(error.message, true);
    } finally {
      setBusy(false);
    }
  });

  body.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button || busy) return;
    const task = api.tasks.find((item) => item.id === (button.dataset.edit || button.dataset.delete || button.dataset.toggleStatus));
    if (!task) return;
    if (button.dataset.edit) {
      fillEditForm(task);
    } else if (button.dataset.delete) {
      if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
      setBusy(true);
      try {
        await api.deleteTask(task.id);
        api.showToast("Task deleted.");
      } catch (error) {
        api.showToast(error.message, true);
      } finally {
        setBusy(false);
      }
    } else {
      const status = task.status === "Pending" ? "In Progress" : task.status === "In Progress" ? "Completed" : "Pending";
      setBusy(true);
      try {
        await api.updateTaskStatus(task.id, status);
        api.showToast(`Task marked ${status.toLowerCase()}.`);
      } catch (error) {
        api.showToast(error.message, true);
      } finally {
        setBusy(false);
      }
    }
  });

  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !editForm.reportValidity()) return;
    const values = Object.fromEntries(new FormData(editForm).entries());
    if (!validateDates(values.startDate, values.deadline)) return;
    const { id, ...updates } = values;
    setBusy(true);
    try {
      await api.updateTask(id, updates);
      dialog.close();
      api.showToast("Task updated.");
    } catch (error) {
      api.showToast(error.message, true);
    } finally {
      setBusy(false);
    }
  });

  document.getElementById("cancel-edit").addEventListener("click", () => dialog.close());
  document.getElementById("task-search").addEventListener("input", render);
  document.getElementById("status-filter").addEventListener("change", render);
  document.getElementById("priority-filter").addEventListener("change", render);
  document.getElementById("sort-order").addEventListener("change", render);
  form.addEventListener("reset", () => window.setTimeout(() => { startField.value = api.today(); }, 0));
  startField.value = api.today();
  deadlineField.min = api.today();
  [startField, deadlineField].forEach((field) => field.addEventListener("change", () => {
    deadlineField.min = startField.value || api.today();
    startField.max = deadlineField.value || "";
  }));
  window.addEventListener("studyflow:tasks-changed", render);
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await api.ready)) return;
    try {
      await api.fetchAllTasks();
    } catch (error) {
      api.showToast(error.message, true);
    }
    render();
  }, { once: true });
  if (location.hash === "#new") window.setTimeout(() => titleField.focus({ preventScroll: true }), 0);
})();
