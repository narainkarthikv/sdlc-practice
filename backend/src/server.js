import "dotenv/config";
import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { closeDb, ensureDbConnection } from "./db.js";
import { requireUser } from "./auth/requireUser.js";
import { requireServiceCaller } from "./auth/serviceAuth.js";
import { loginUser, signupUser } from "./auth/users.js";
import { createTask, deleteTask, deleteTasks, getTask, listTasks, taskStats, updateTask } from "./tasks.js";

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
  requireServiceCaller(req).then(() => next()).catch(next);
});
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

function formatErrorMessage(error) {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    if (
      firstIssue?.code === "invalid_type" &&
      firstIssue.path.length === 0 &&
      firstIssue.received === "undefined"
    ) {
      return "Request body is required";
    }

    return firstIssue?.message || "Invalid request payload";
  }

  return error instanceof Error ? error.message : "Internal server error";
}

app.post("/auth/signup", async (req, res, next) => {
  try {
    res.status(201).json(await signupUser(req.body));
  } catch (error) {
    next(error);
  }
});

app.post("/auth/login", async (req, res, next) => {
  try {
    res.json(await loginUser(req.body));
  } catch (error) {
    next(error);
  }
});

app.get("/tasks", async (req, res, next) => {
  try {
    const user = await requireUser(req);
    res.json(await listTasks(user.id));
  } catch (error) {
    next(error);
  }
});

app.get("/tasks/stats", async (req, res, next) => {
  try {
    const user = await requireUser(req);
    res.json(await taskStats(user.id));
  } catch (error) {
    next(error);
  }
});

app.get("/tasks/:id", async (req, res, next) => {
  try {
    const user = await requireUser(req);
    const task = await getTask(user.id, req.params.id);
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
    const user = await requireUser(req);
    const task = await createTask(user.id, req.body);
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.patch("/tasks/:id", async (req, res, next) => {
  try {
    const user = await requireUser(req);
    const task = await updateTask(user.id, req.params.id, req.body);
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
    const user = await requireUser(req);
    const deleted = await deleteTask(user.id, req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Task not found" });
    }
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Bulk delete endpoint — accepts { ids: string[] } in the body and deletes tasks owned by the authenticated user
app.post("/tasks/bulk-delete", async (req, res, next) => {
  try {
    const user = await requireUser(req);
    const ids = req.body && req.body.ids;
    if (!Array.isArray(ids) || ids.some((id) => typeof id !== "string")) {
      return res.status(400).json({ message: "ids must be an array of task id strings" });
    }
    const deletedCount = await deleteTasks(user.id, ids);
    return res.json({ deleted: deletedCount });
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  const message = formatErrorMessage(error);
  const status =
    error instanceof ZodError
      ? 400
      : typeof error?.statusCode === "number"
        ? error.statusCode
        : 500;
  res.status(status).json({ message });
});

async function start() {
  await ensureDbConnection();
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
