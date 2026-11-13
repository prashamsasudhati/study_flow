"use strict";

const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, "Task title is required."],
    trim: true,
    minlength: [1, "Task title cannot be empty."],
    maxlength: [120, "Task title cannot exceed 120 characters."]
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, "Description cannot exceed 2000 characters."],
    default: ""
  },
  category: {
    type: String,
    required: [true, "Subject or category is required."],
    trim: true,
    minlength: [1, "Subject or category cannot be empty."],
    maxlength: [60, "Subject or category cannot exceed 60 characters."]
  },
  startDate: {
    type: Date,
    required: [true, "Start date is required."]
  },
  deadline: {
    type: Date,
    required: [true, "Deadline is required."]
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    default: "Pending",
    required: true
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
    required: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform(_document, result) {
      delete result.__v;
      return result;
    }
  }
});

taskSchema.index({ userId: 1, deadline: 1 });
taskSchema.index({ userId: 1, status: 1, deadline: 1 });
taskSchema.index({ userId: 1, priority: 1, deadline: 1 });

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
