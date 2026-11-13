(function () {
  "use strict";
  const api = window.StudyFlow;
  const grid = document.getElementById("calendar-grid");
  const title = document.getElementById("calendar-month");
  let visibleMonth = new Date();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function keyFor(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function render() {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    title.textContent = visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    const tasksByDate = new Map();
    api.tasks.forEach((task) => {
      if (!tasksByDate.has(task.deadline)) tasksByDate.set(task.deadline, []);
      tasksByDate.get(task.deadline).push(task);
    });
    const weekdayMarkup = weekdays.map((day) => `<div class="calendar-weekday">${day}</div>`).join("");
    const dayMarkup = Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const dateKey = keyFor(date);
      const classes = ["calendar-day"];
      if (date.getMonth() !== month) classes.push("muted-day");
      if (dateKey === api.today()) classes.push("today");
      const events = (tasksByDate.get(dateKey) || []).slice(0, 2).map((task) => {
        const overdue = task.status !== "Completed" && task.deadline < api.today();
        return `<div class="calendar-event${overdue ? " overdue" : ""}" title="${api.escapeHtml(task.title)} — ${api.escapeHtml(task.priority)} priority — ${api.escapeHtml(task.status)}">${api.escapeHtml(task.title)}</div>`;
      }).join("");
      const more = (tasksByDate.get(dateKey) || []).length > 2 ? `<div class="calendar-event">+${tasksByDate.get(dateKey).length - 2} more</div>` : "";
      return `<div class="${classes.join(" ")}"><span class="calendar-number">${date.getDate()}</span>${events}${more}</div>`;
    }).join("");
    grid.innerHTML = weekdayMarkup + dayMarkup;

    const upcoming = api.tasks.filter((task) => task.status !== "Completed" && task.deadline >= api.today() && task.deadline <= api.addDays(7))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    document.getElementById("calendar-upcoming").innerHTML = upcoming.length ? upcoming.map((task) => {
      const date = new Date(`${task.deadline}T00:00:00`);
      return `<div class="deadline-item"><div class="date-block"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString(undefined, { month: "short" })}</span></div><div class="deadline-copy"><strong>${api.escapeHtml(task.title)}</strong><span>${api.escapeHtml(task.category)} · ${api.formatDate(task.deadline)}</span></div></div>`;
    }).join("") : '<div class="empty-state">No deadlines in the next seven days.</div>';
    const stats = api.getStats();
    const reminder = document.getElementById("deadline-reminders");
    reminder.innerHTML = stats.overdue || stats.dueToday
      ? `<div class="preview-note">${stats.overdue ? `<strong>${stats.overdue} overdue task${stats.overdue === 1 ? "" : "s"}</strong> may need a new plan.<br>` : ""}${stats.dueToday ? `<strong>${stats.dueToday} task${stats.dueToday === 1 ? "" : "s"} due today.</strong> Take them one at a time.` : ""}</div><a class="text-link" href="notifications.html">Review reminders →</a>`
      : '<div class="empty-state">You’re up to date. No overdue tasks or deadlines today.</div>';
  }

  document.getElementById("previous-month").addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1); render(); });
  document.getElementById("next-month").addEventListener("click", () => { visibleMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1); render(); });
  document.getElementById("today-button").addEventListener("click", () => { visibleMonth = new Date(); render(); });
  document.addEventListener("DOMContentLoaded", async () => {
    if (!(await api.ready)) return;
    try {
      await Promise.all([api.fetchAllTasks(), api.refreshDashboard()]);
    } catch (error) {
      api.showToast(error.message, true);
    }
    render();
  }, { once: true });
  window.addEventListener("studyflow:tasks-changed", render);
  window.addEventListener("studyflow:dashboard-changed", render);
})();
