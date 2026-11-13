(function () {
  "use strict";
  const api = window.StudyFlow;

  function render() {
    const tasks = api.tasks;
    const stats = api.getStats();
    document.getElementById("progress-rate").textContent = `${stats.percent}%`;
    document.getElementById("progress-completed").textContent = stats.completed;
    document.getElementById("progress-pending").textContent = stats.pending;
    document.getElementById("progress-overdue").textContent = stats.overdue;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
    const days = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    const counts = days.map((date) => {
      const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return tasks.filter((task) => task.status === "Completed" && (task.updatedAt || task.createdAt || "").slice(0, 10) === dateKey).length;
    });
    const max = Math.max(1, ...counts);
    document.getElementById("weekly-chart").innerHTML = days.map((date, index) => {
      const height = counts[index] ? Math.max(8, Math.round((counts[index] / max) * 100)) : 3;
      return `<div class="chart-column" title="${counts[index]} completed"><div class="chart-bar" style="height:${height}%"></div><span class="chart-label">${date.toLocaleDateString(undefined, { weekday: "short" })}</span></div>`;
    }).join("");
    const categories = new Map();
    tasks.forEach((task) => {
      const category = task.category || "Other";
      categories.set(category, categories.get(category) || { total: 0, completed: 0 });
      categories.get(category).total += 1;
      if (task.status === "Completed") categories.get(category).completed += 1;
    });
    const categoryContainer = document.getElementById("category-progress");
    const list = [...categories.entries()].sort((a, b) => b[1].total - a[1].total);
    categoryContainer.innerHTML = list.length ? list.map(([name, value]) => {
      const percent = Math.round((value.completed / value.total) * 100);
      return `<div style="margin-bottom:17px"><div style="display:flex;justify-content:space-between;margin-bottom:7px;font-size:11px"><strong>${api.escapeHtml(name)}</strong><span class="muted">${value.completed}/${value.total} · ${percent}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div>`;
    }).join("") : '<div class="empty-state">Add a task to start tracking progress by subject.</div>';
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
  window.addEventListener("studyflow:tasks-changed", render);
  window.addEventListener("studyflow:dashboard-changed", render);
})();
