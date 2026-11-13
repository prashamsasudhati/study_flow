"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { isDateOnly, asUtcDate, getUtcDayBounds, calculateTaskStats } = require("./taskUtils");

test("date-only validation rejects impossible dates and non-date strings", () => {
  assert.equal(isDateOnly("2026-11-10"), true);
  assert.equal(isDateOnly("2026-02-29"), false);
  assert.equal(isDateOnly("not-a-date"), false);
  assert.equal(isDateOnly("2026-1-01"), false);
});

test("date-only values are represented at midnight UTC", () => {
  assert.equal(asUtcDate("2026-11-10").toISOString(), "2026-11-10T00:00:00.000Z");
  assert.equal(asUtcDate("2026-02-30"), null);
});

test("UTC day bounds cover exactly one calendar day", () => {
  const { start, end } = getUtcDayBounds(new Date("2026-11-10T18:45:00.000Z"));
  assert.equal(start.toISOString(), "2026-11-10T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-11-11T00:00:00.000Z");
});

test("task statistics calculate pending, completed, overdue, due-today, and progress", () => {
  const now = new Date("2026-11-10T12:00:00.000Z");
  const stats = calculateTaskStats([
    { status: "Pending", deadline: "2026-11-09T00:00:00.000Z" },
    { status: "In Progress", deadline: "2026-11-10T00:00:00.000Z" },
    { status: "Completed", deadline: "2026-11-08T00:00:00.000Z" },
    { status: "Pending", deadline: "2026-11-12T00:00:00.000Z" }
  ], now);

  assert.deepEqual(stats, {
    total: 4,
    pending: 2,
    inProgress: 1,
    completed: 1,
    overdue: 1,
    dueToday: 1,
    progress: 25
  });
});

test("empty task statistics do not divide by zero", () => {
  assert.equal(calculateTaskStats([]).progress, 0);
});
