import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  createTask,
  deleteTask,
  fetchProductivitySummary,
  fetchTaskSummary,
  fetchTasks,
  updateTask
} from "./lib/api";
import type {
  ProductivitySummaryResponse,
  SummaryPeriod,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
  TaskSummaryResponse
} from "./types";

const emptyTask: TaskInput = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: ""
};

const statusLabels: Record<TaskStatus, string> = {
  todo: "Todo",
  in_progress: "In Progress",
  done: "Done"
};

const statusClasses: Record<TaskStatus, string> = {
  todo: "bg-slate-800 text-slate-200",
  in_progress: "bg-amber-500/15 text-amber-200",
  done: "bg-emerald-500/15 text-emerald-200"
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

const periodLabels: Record<SummaryPeriod, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year"
};

function formatDate(value: string | null): string {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState<TaskInput>(emptyTask);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<SummaryPeriod>("day");
  const [productivitySummary, setProductivitySummary] = useState<ProductivitySummaryResponse | null>(
    null
  );
  const [taskSummary, setTaskSummary] = useState<TaskSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((task) => task.status === "done").length;
    const inProgress = tasks.filter((task) => task.status === "in_progress").length;
    const overdue = tasks.filter(
      (task) => task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date()
    ).length;

    return { total, done, inProgress, overdue };
  }, [tasks]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...taskForm,
        dueDate: taskForm.dueDate || null,
        description: taskForm.description?.trim() || ""
      };

      if (editingId) {
        const updated = await updateTask(editingId, payload);
        setTasks((current) => current.map((task) => (task.id === editingId ? updated : task)));
      } else {
        const created = await createTask(payload);
        setTasks((current) => [created, ...current]);
      }

      setTaskForm(emptyTask);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setSaving(true);
    setError(null);

    try {
      await deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(task: Task) {
    setEditingId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? ""
    });
  }

  function resetForm() {
    setTaskForm(emptyTask);
    setEditingId(null);
  }

  async function generateSummaries() {
    setSummaryLoading(true);
    setError(null);
    try {
      const [productivity, taskSummaryResponse] = await Promise.all([
        fetchProductivitySummary(period, tasks),
        fetchTaskSummary(tasks)
      ]);
      setProductivitySummary(productivity);
      setTaskSummary(taskSummaryResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summaries");
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glow backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">Todoist SDLC</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Ship tasks, inspect flow, and generate AI summaries.
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                React frontend, Express CRUD API, and Gemini-powered agents for productivity and
                task intelligence.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Total", stats.total],
                ["Done", stats.done],
                ["In progress", stats.inProgress],
                ["Overdue", stats.overdue]
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</div>
                  <div className="mt-2 text-3xl font-semibold text-white">{value as number}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-glow">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                {editingId ? "Edit task" : "Create task"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                placeholder="Task title"
                value={taskForm.title}
                onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                required
              />
              <textarea
                className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50"
                placeholder="Description"
                value={taskForm.description}
                onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <select
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  value={taskForm.status}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, status: event.target.value as TaskStatus })
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })
                  }
                >
                  {Object.entries(priorityLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                  value={taskForm.dueDate ?? ""}
                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-cyan-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Update task" : "Create task"}
              </button>
            </form>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Task queue</h3>
                <button
                  type="button"
                  onClick={loadTasks}
                  className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/5"
                >
                  Refresh
                </button>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-300">
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-slate-300">
                  No tasks yet. Create the first one above.
                </div>
              ) : (
                <div className="grid gap-3">
                  {tasks.map((task) => (
                    <article
                      key={task.id}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-base font-semibold text-white">{task.title}</h4>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClasses[task.status]}`}
                            >
                              {statusLabels[task.status]}
                            </span>
                            <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
                              {priorityLabels[task.priority]}
                            </span>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {task.description || "No description"}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            Due {formatDate(task.dueDate)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(task)}
                            className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200 hover:bg-white/5"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task.id)}
                            className="rounded-full border border-rose-500/20 px-3 py-1 text-sm text-rose-200 hover:bg-rose-500/10"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-950/55 p-5 shadow-glow">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">AI summaries</h2>
                <p className="text-sm text-slate-400">
                  Gemini-backed summaries from the agents service.
                </p>
              </div>
              <select
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-white outline-none"
                value={period}
                onChange={(event) => setPeriod(event.target.value as SummaryPeriod)}
              >
                {Object.entries(periodLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={generateSummaries}
              disabled={summaryLoading || tasks.length === 0}
              className="mt-4 rounded-2xl bg-emerald-400 px-4 py-3 font-medium text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {summaryLoading ? "Generating..." : "Generate summaries"}
            </button>

            <div className="mt-5 grid gap-4">
              <SummaryCard
                title={`Productivity summary for ${periodLabels[period]}`}
                body={productivitySummary?.summary ?? "Run the agent to generate a productivity summary."}
                bullets={productivitySummary ? productivitySummary.highlights : []}
                secondary={productivitySummary ? productivitySummary.risks : []}
                tertiary={productivitySummary ? productivitySummary.nextSteps : []}
              />
              <SummaryCard
                title="Task summary"
                body={taskSummary?.summary ?? "Run the agent to summarize the application tasks."}
                bullets={
                  taskSummary
                    ? [
                        `Todo: ${taskSummary.breakdown.todo}`,
                        `In progress: ${taskSummary.breakdown.in_progress}`,
                        `Done: ${taskSummary.breakdown.done}`
                      ]
                    : []
                }
                secondary={taskSummary ? taskSummary.blockers : []}
                tertiary={taskSummary ? taskSummary.recommendations : []}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  body,
  bullets,
  secondary,
  tertiary
}: {
  title: string;
  body: string;
  bullets: string[];
  secondary: string[];
  tertiary: string[];
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
      {bullets.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm text-slate-200">
          {bullets.map((item) => (
            <li key={item} className="rounded-xl bg-slate-900/60 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {secondary.length > 0 ? (
        <div className="mt-4 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Risks / blockers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {secondary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {tertiary.length > 0 ? (
        <div className="mt-4 text-sm text-slate-300">
          <p className="font-medium text-slate-100">Next steps</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {tertiary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </article>
  );
}

export default App;
