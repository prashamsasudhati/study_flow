"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Task = require("./Task");

function validTask(overrides) {
  return new Task({
    userId: new mongoose.Types.ObjectId(),
    title: "Test assignment",
    category: "Testing",
    startDate: new Date("2026-11-10T00:00:00.000Z"),
    deadline: new Date("2026-11-12T00:00:00.000Z"),
    ...overrides
  });
}

test("task priority defaults to Medium", () => {
  assert.equal(validTask().priority, "Medium");
});

test("task accepts Low, Medium, and High priority values", () => {
  for (const priority of ["Low", "Medium", "High"]) {
    assert.equal(validTask({ priority }).validateSync(), undefined);
  }
});

test("task rejects an unsupported priority value", () => {
  const error = validTask({ priority: "Urgent" }).validateSync();
  assert.ok(error);
  assert.equal(error.errors.priority.kind, "enum");
});
