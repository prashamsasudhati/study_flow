"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const app = require("./app");

test("health route is public and task routes reject requests without a JWT", async () => {
  const server = app.listen(0);
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const health = await fetch(`${baseUrl}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { success: true, data: { status: "ok" } });

    const protectedResponse = await fetch(`${baseUrl}/api/tasks`);
    assert.equal(protectedResponse.status, 401);
    assert.equal((await protectedResponse.json()).message, "Authentication token required.");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("CORS accepts the local preview and rejects unconfigured origins", async () => {
  const server = app.listen(0);
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const allowed = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: "http://localhost:5500" }
    });
    assert.equal(allowed.headers.get("access-control-allow-origin"), "http://localhost:5500");

    const rejected = await fetch(`${baseUrl}/api/health`, {
      headers: { Origin: "https://unapproved.example" }
    });
    assert.equal(rejected.status, 403);
    assert.equal((await rejected.json()).message, "Origin is not allowed by the CORS policy.");
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("registration rejects invalid input before attempting database access", async () => {
  const server = app.listen(0);
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "A", email: "not-an-email", password: "short" })
    });
    const result = await response.json();
    assert.equal(response.status, 400);
    assert.equal(result.success, false);
    assert.equal(result.message, "Request validation failed.");
    assert.ok(result.errors.length >= 3);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("routine current-user checks do not consume the login rate limit", async () => {
  const server = app.listen(0);
  try {
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const address = server.address();
    const responses = await Promise.all(Array.from({ length: 12 }, () =>
      fetch(`http://127.0.0.1:${address.port}/api/auth/me`)
    ));
    assert.ok(responses.every((response) => response.status === 401));
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
