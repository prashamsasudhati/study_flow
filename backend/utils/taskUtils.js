"use strict";

function isDateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function asUtcDate(value) {
  if (!isDateOnly(value)) return null;
  return new Date(`${value}T00:00:00.000Z`);
}

function getUtcDayBounds(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

function calculateTaskStats(tasks, now = new Date()) {
  const today = getUtcDayBounds(now).start;
  const counts = {
    total: tasks.length,
    pending: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    dueToday: 0
  };

  tasks.forEach((task) => {
    if (task.status === "Completed") {
      counts.completed += 1;
      return;
    }
    if (task.status === "Pending") counts.pending += 1;
    if (task.status === "In Progress") counts.inProgress += 1;
    const deadline = new Date(task.deadline);
    if (deadline < today) counts.overdue += 1;
    if (deadline.getTime() === today.getTime()) counts.dueToday += 1;
  });

  counts.progress = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  return counts;
}

module.exports = { isDateOnly, asUtcDate, getUtcDayBounds, calculateTaskStats };
