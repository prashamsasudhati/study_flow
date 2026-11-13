(function () {
  "use strict";
  const api = window.StudyFlow;
  function render() {
    const today = api.today();
    const notifications = api.tasks.filter((task) => task.status !== "Completed" && task.deadline <= api.addDays(3))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    const container = document.getElementById("notification-list");
    document.getElementById("notification-total").textContent = `${notifications.length} reminder${notifications.length === 1 ? "" : "s"}`;
    if (!notifications.length) {
      container.innerHTML = '<div class="empty-state">No approaching deadlines right now. You’re all caught up.</div>';
      return;
    }
    container.innerHTML = notifications.map((task) => {
      const overdue = task.deadline < today;
      const dueToday = task.deadline === today;
      const heading = overdue ? "This task is overdue" : dueToday ? "Due today" : "Deadline coming up";
      const dateText = overdue ? `Was due ${api.formatDate(task.deadline, { month: "long", day: "numeric" })}` : `Due ${api.formatDate(task.deadline, { weekday: "long", month: "long", day: "numeric" })}`;
      return `<article class="notification-item unread"><span class="notification-dot-large" style="${overdue ? "background:var(--red)" : dueToday ? "background:var(--amber)" : ""}"></span><div class="notification-copy"><strong>${heading}: ${api.escapeHtml(task.title)}</strong><p>${api.escapeHtml(task.category)} · ${dateText}. Take a moment to review your next step.</p><time>${overdue ? "Needs attention" : dueToday ? "Today" : "Coming soon"}</time></div><span class="priority-pill priority-${task.priority.toLowerCase()}">${api.escapeHtml(task.priority)}</span><a class="text-link" href="tasks.html">View task</a></article>`;
    }).join("");
  }
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await api.ready)) return;
    try {
      await api.fetchAllTasks();
    } catch (error) {
      api.showToast(error.message, true);
    }
    render();
  }, { once: true });
  window.addEventListener("studyflow:tasks-changed", render);
})();
