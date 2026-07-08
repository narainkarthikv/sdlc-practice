import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { closeDb, ensureDbConnection } from "./db.js";
import { initializeDatabase } from "./init-db.js";
import { createTask, deleteTask, getTask, listTasks, taskStats, updateTask } from "./tasks.js";

const app = express();
const port = Number(process.env.PORT || 8080);
const origins = (process.env.CORS_ORIGINS || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.includes("*") ? true : origins
  })
);
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  const requestId = req.header("x-request-id") || randomUUID();
  const startedAt = Date.now();

  res.setHeader("x-request-id", requestId);
  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      JSON.stringify({
        requestId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs
      })
    );
  });

  next();
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/tasks", async (_req, res, next) => {
  try {
    res.json(await listTasks());
  } catch (error) {
    next(error);
  }
});

app.get("/tasks/stats", async (_req, res, next) => {
  try {
    res.json(await taskStats());
  } catch (error) {
    next(error);
  }
});

app.get("/tasks/:id", async (req, res, next) => {
  try {
    const task = await getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.json(task);
  } catch (error) {
    next(error);
  }
});

app.post("/tasks", async (req, res, next) => {
  try {
    const task = await createTask(req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch("/tasks/:id", async (req, res, next) => {
  try {
    const task = await updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.json(task);
  } catch (error) {
    next(error);
  }
});

app.delete("/tasks/:id", async (req, res, next) => {
  try {
    const deleted = await deleteTask(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Internal server error";
  const status = error instanceof ZodError ? 400 : 500;
  res.status(status).json({ message });
});

async function start() {
  await ensureDbConnection();
  await initializeDatabase();
  const server = app.listen(port, () => {
    console.log(`Backend listening on ${port}`);
  });

  const shutdown = async () => {
    server.close(() => {});
    await closeDb();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
