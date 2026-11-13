(function () {
  "use strict";
  const api = window.StudyFlow;

  function renderTaskRows(container, items, emptyMessage) {
    if (!items.length) {
      container.innerHTML = `<div class="empty-state">${api.escapeHtml(emptyMessage)}</div>`;
      return;
    }
    container.innerHTML = items.map((task) => {
      const completed = task.status === "Completed";
      const overdue = task.status !== "Completed" && task.deadline < api.today();
      const label = overdue ? "Overdue" : task.status;
      return `<div class="task-row"><button class="check-button${completed ? " done" : ""}" data-complete="${api.escapeHtml(task.id)}" aria-label="${completed ? "Mark incomplete" : "Mark complete"}">${completed ? "✓" : ""}</button><div class="task-row-copy"><div class="task-row-title${completed ? " done" : ""}">${api.escapeHtml(task.title)}</div><div class="task-subtitle">${api.escapeHtml(task.category)}</div></div><span class="priority-pill priority-${task.priority.toLowerCase()}">${api.escapeHtml(task.priority)}</span><span class="status-pill ${overdue ? "status-overdue" : api.statusClass(task)}">${api.escapeHtml(label)}</span><span class="task-date">${api.formatDate(task.deadline)}</span></div>`;
    }).join("");
    container.querySelectorAll("[data-complete]").forEach((button) => {
      button.addEventListener("click", async () => {
        const task = api.tasks.find((item) => item.id === button.dataset.complete);
        if (!task) return;
        button.disabled = true;
        try {
          const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
          await api.updateTaskStatus(task.id, nextStatus);
          api.showToast(nextStatus === "Completed" ? "Task completed — great work!" : "Task moved back to pending.");
        } catch (error) {
          api.showToast(error.message, true);
          button.disabled = false;
        }
      });
    });
  }

  function render() {
    const data = api.dashboard;
    if (!data) return;
    const stats = data.stats;
    document.getElementById("stat-total").textContent = stats.total;
    document.getElementById("stat-pending").textContent = stats.pending;
    document.getElementById("stat-completed").textContent = stats.completed;
    document.getElementById("stat-overdue").textContent = stats.overdue;
    document.getElementById("progress-value").textContent = `${stats.progress}%`;
    document.getElementById("progress-caption").textContent = `${stats.completed} of ${stats.total} tasks complete`;
    document.getElementById("progress-fill").style.width = `${stats.progress}%`;
    document.getElementById("due-today-count").textContent = `${stats.dueToday} today`;
    renderTaskRows(document.getElementById("recent-tasks"), data.recentTasks, "No tasks yet. Add one to get started.");
    const todayTasks = api.tasks.filter((task) => task.status !== "Completed" && task.deadline === api.today());
    renderTaskRows(document.getElementById("today-tasks"), todayTasks, "No tasks are due today. Enjoy the breathing room.");

    const upcoming = data.upcomingDeadlines.slice(0, 4);
    const deadlineContainer = document.getElementById("upcoming-deadlines");
    deadlineContainer.innerHTML = upcoming.length ? upcoming.map((task) => {
      const date = new Date(`${task.deadline}T00:00:00`);
      return `<div class="deadline-item"><div class="date-block"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString(undefined, { month: "short" })}</span></div><div class="deadline-copy"><strong>${api.escapeHtml(task.title)}</strong><span>${api.escapeHtml(task.category)} · ${task.deadline === api.today() ? "Due today" : api.formatDate(task.deadline)}</span></div><span class="priority-pill priority-${task.priority.toLowerCase()}">${api.escapeHtml(task.priority)}</span></div>`;
    }).join("") : '<div class="empty-state">No upcoming deadlines. You’re all caught up.</div>';
    document.getElementById("today-label").textContent =
      new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
    document.querySelectorAll("[data-user-first-name]").forEach((el) => { el.textContent = api.user.name.split(/\s+/)[0]; });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await api.ready)) return;
    try {
      await Promise.all([api.fetchAllTasks(), api.refreshDashboard()]);
    } catch (error) {
      api.showToast(error.message, true);
    }
    render();
  }, { once: true });
  window.addEventListener("studyflow:dashboard-changed", render);
})();
