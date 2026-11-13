"use strict";

const Task = require("../models/Task");
const { getUtcDayBounds } = require("../utils/taskUtils");

async function getDashboardStats(req, res, next) {
  try {
    const now = new Date();
    const { start: today, end: tomorrow } = getUtcDayBounds(now);
    const weekAhead = new Date(tomorrow.getTime() + 7 * 24 * 60 * 60 * 1000);
    const ownedTasks = { userId: req.user._id };
    const notCompleted = { status: { $ne: "Completed" } };
    const [
      total,
      completed,
      pending,
      inProgress,
      overdue,
      dueToday,
      recentTasks,
      upcomingDeadlines
    ] = await Promise.all([
      Task.countDocuments(ownedTasks),
      Task.countDocuments({ ...ownedTasks, status: "Completed" }),
      Task.countDocuments({ ...ownedTasks, status: "Pending" }),
      Task.countDocuments({ ...ownedTasks, status: "In Progress" }),
      Task.countDocuments({ ...ownedTasks, ...notCompleted, deadline: { $lt: today } }),
      Task.countDocuments({ ...ownedTasks, ...notCompleted, deadline: { $gte: today, $lt: tomorrow } }),
      Task.find(ownedTasks).sort({ createdAt: -1 }).limit(5),
      Task.find({
        ...ownedTasks,
        ...notCompleted,
        deadline: { $gte: today, $lt: weekAhead }
      }).sort({ deadline: 1 }).limit(10)
    ]);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          total,
          pending,
          inProgress,
          completed,
          overdue,
          dueToday,
          progress: total ? Math.round((completed / total) * 100) : 0
        },
        recentTasks,
        upcomingDeadlines
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getDashboardStats };
