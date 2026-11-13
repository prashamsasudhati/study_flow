"use strict";

const express = require("express");
const { body, query } = require("express-validator");
const taskController = require("../controllers/taskController");
const requireAuth = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { isDateOnly } = require("../utils/taskUtils");

const router = express.Router();
const statuses = ["Pending", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];
const validateDateField = (field, required) => {
  const rule = body(field);
  if (!required) rule.optional();
  return rule.isString().withMessage(`${field} must be a YYYY-MM-DD date.`).bail()
    .custom(isDateOnly).withMessage(`${field} must be a valid YYYY-MM-DD date.`);
};
const taskFields = (required) => [
  required
    ? body("title").isString().withMessage("Title must be text.").bail().trim()
      .isLength({ min: 1, max: 120 }).withMessage("Title must be between 1 and 120 characters.")
    : body("title").optional().isString().withMessage("Title must be text.").bail().trim()
      .isLength({ min: 1, max: 120 }).withMessage("Title must be between 1 and 120 characters."),
  required
    ? body("category").isString().withMessage("Category must be text.").bail().trim()
      .isLength({ min: 1, max: 60 }).withMessage("Category must be between 1 and 60 characters.")
    : body("category").optional().isString().withMessage("Category must be text.").bail().trim()
      .isLength({ min: 1, max: 60 }).withMessage("Category must be between 1 and 60 characters."),
  body("description").optional().isString().withMessage("Description must be text.").bail()
    .trim().isLength({ max: 2000 }).withMessage("Description cannot exceed 2000 characters."),
  validateDateField("startDate", required),
  validateDateField("deadline", required),
  required
    ? body("status").optional().isIn(statuses).withMessage("Status must be Pending, In Progress, or Completed.")
    : body("status").optional().isIn(statuses).withMessage("Status must be Pending, In Progress, or Completed."),
  body("priority").optional().isIn(priorities).withMessage("Priority must be Low, Medium, or High.")
];

router.use(requireAuth);
router.get("/",
  query("status").optional().isIn([...statuses, "Overdue"]).withMessage("Status filter is invalid."),
  query("priority").optional().isIn(priorities).withMessage("Priority filter is invalid."),
  query("search").optional().trim().isLength({ max: 100 }).withMessage("Search cannot exceed 100 characters."),
  query("sort").optional().isIn(["deadline", "createdAt"]).withMessage("Sort must be deadline or createdAt."),
  query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc."),
  query("page").optional().isInt({ min: 1, max: 100000 }).toInt().withMessage("Page must be a positive integer."),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt().withMessage("Limit must be between 1 and 100."),
  validateRequest,
  taskController.listTasks
);
router.post("/", ...taskFields(true), validateRequest, taskController.createTask);
router.get("/:id", taskController.validateTaskOwnershipId, taskController.getTask);
router.put("/:id",
  taskController.validateTaskOwnershipId,
  ...taskFields(false),
  validateRequest,
  taskController.updateTask
);
router.put("/:id/status",
  taskController.validateTaskOwnershipId,
  body("status").isIn(statuses).withMessage("Status must be Pending, In Progress, or Completed."),
  validateRequest,
  taskController.updateTaskStatus
);
router.delete("/:id", taskController.validateTaskOwnershipId, taskController.deleteTask);

module.exports = router;
