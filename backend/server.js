"use strict";

require("dotenv").config();
const http = require("node:http");
const mongoose = require("mongoose");
const app = require("./app");
const connectDatabase = require("./config/db");

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET is missing or shorter than 32 characters. Configure backend/.env.");
  }
  await connectDatabase();

  const port = Number(process.env.PORT || 3000);
  const server = http.createServer(app);
  server.listen(port, () => {
    console.log(`StudyFlow API listening on http://localhost:${port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Closing the API server.`);
    server.close(async (error) => {
      if (error) {
        console.error("Could not close the API server cleanly.", error);
        process.exitCode = 1;
      }
      await mongoose.disconnect();
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error(`StudyFlow API could not start: ${error.message}`);
  process.exitCode = 1;
});
