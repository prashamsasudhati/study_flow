"use strict";

const mongoose = require("mongoose");
const Task = require("../models/Task");
const { asUtcDate, getUtcDayBounds } = require("../utils/taskUtils");

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function taskQueryFor(req) {
  const query = { userId: req.user._id };
  if (req.query.priority) query.priority = req.query.priority;
  if (req.query.status === "Overdue") {
    query.status = { $ne: "Completed" };
    query.deadline = { $lt: getUtcDayBounds().start };
  } else if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.search) {
    const expression = new RegExp(escapeRegex(req.query.search), "i");
    query.$or = [{ title: expression }, { description: expression }, { category: expression }];
  }
  return query;
}

async function listTasks(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 50);
    const sortField = req.query.sort === "createdAt" ? "createdAt" : "deadline";
    const sortOrder = req.query.order === "desc" ? -1 : 1;
    const query = taskQueryFor(req);
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ [sortField]: sortOrder, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: { tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
    });
  } catch (error) {
    return next(error);
  }
}

async function getTask(req, res, next) {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    return res.status(200).json({ success: true, data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function createTask(req, res, next) {
  try {
    const { title, description, category, startDate, deadline, status, priority } = req.body;
    const start = asUtcDate(startDate);
    const due = asUtcDate(deadline);
    if (due < start) {
      return res.status(400).json({ success: false, message: "Deadline must be on or after the start date." });
    }

    const task = await Task.create({
      userId: req.user._id,
      title,
      description,
      category,
      startDate: start,
      deadline: due,
      status,
      priority
    });
    return res.status(201).json({ success: true, message: "Task created successfully.", data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function updateTask(req, res, next) {
  try {
    const allowedFields = ["title", "description", "category", "startDate", "deadline", "status", "priority"];
    const updates = Object.fromEntries(allowedFields
      .filter((field) => Object.hasOwn(req.body, field))
      .map((field) => [field, req.body[field]]));
    if (!Object.keys(updates).length) {
      return res.status(400).json({ success: false, message: "Provide at least one task field to update." });
    }
    if (Object.hasOwn(updates, "startDate")) updates.startDate = asUtcDate(updates.startDate);
    if (Object.hasOwn(updates, "deadline")) updates.deadline = asUtcDate(updates.deadline);

    const task = await Task.findOne({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    const startDate = updates.startDate || task.startDate;
    const deadline = updates.deadline || task.deadline;
    if (deadline < startDate) {
      return res.status(400).json({ success: false, message: "Deadline must be on or after the start date." });
    }
    Object.assign(task, updates);
    await task.save();
    return res.status(200).json({ success: true, message: "Task updated successfully.", data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function updateTaskStatus(req, res, next) {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { status: req.body.status } },
      { new: true, runValidators: true }
    );
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    return res.status(200).json({ success: true, message: "Task status updated.", data: { task } });
  } catch (error) {
    return next(error);
  }
}

async function deleteTask(req, res, next) {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    return res.status(200).json({ success: true, message: "Task deleted successfully.", data: { taskId: task._id } });
  } catch (error) {
    return next(error);
  }
}

function validateTaskOwnershipId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ success: false, message: "Task ID is invalid." });
  }
  return next();
}

module.exports = { listTasks, getTask, createTask, updateTask, updateTaskStatus, deleteTask, validateTaskOwnershipId };
