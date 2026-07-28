import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../auth/authSlice";
import {
  createTask,
  deleteTask,
  fetchProductivitySummary,
  fetchTaskSummary,
  fetchTasks,
  updateTask
} from "../../api";
import { useTheme } from "../../themeContext";
import type {
  ProductivitySummaryResponse,
  SummaryPeriod,
  Task,
  TaskInput,
  TaskPriority,
  TaskStatus,
  TaskSummaryResponse
} from "../../types";

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

type TaskFilter = "all" | TaskStatus | "high_priority" | "low_priority";
type Theme = "light" | "dark";

function formatDate(value: string | null): string {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

function getPeriodWindowDays(period: SummaryPeriod): number {
  switch (period) {
    case "day":
      return 1;
    case "week":
      return 7;
    case "month":
      return 30;
    case "year":
      return 365;
    default:
      return 7;
  }
}

function parseLocalDate(dateValue: string): Date {
  return new Date(`${dateValue}T00:00:00`);
}

function isTaskInPeriod(task: Task, period: SummaryPeriod, now = new Date()): boolean {
  if (!task.dueDate) {
    return false;
  }

  const dueDate = parseLocalDate(task.dueDate);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + getPeriodWindowDays(period));
  end.setHours(23, 59, 59, 999);

  return dueDate >= start && dueDate <= end;
}

function getStatusBadgeClasses(status: TaskStatus): string {
  const classes: Record<TaskStatus, string> = {
    todo:
      "dark:bg-slate-800 dark:text-slate-200 light:bg-slate-200 light:text-slate-700 dark:border-white/10 light:border-slate-300",
    in_progress:
      "dark:bg-cyan-400/15 dark:text-cyan-200 light:bg-blue-100 light:text-blue-700 dark:border-cyan-400/20 light:border-blue-200",
    done:
      "dark:bg-emerald-400/15 dark:text-emerald-200 light:bg-emerald-100 light:text-emerald-700 dark:border-emerald-400/20 light:border-emerald-200"
  };

  return classes[status];
}

function getPriorityBadgeClasses(priority: TaskPriority, theme: Theme): string {
  if (priority === "high") {
    return theme === "light"
      ? "border border-rose-200 bg-rose-100 text-rose-700"
      : "border border-rose-400/20 bg-rose-400/15 text-rose-200";
  }

  if (priority === "low") {
    return theme === "light"
      ? "border border-blue-200 bg-blue-100 text-blue-700"
      : "border border-cyan-400/20 bg-cyan-400/15 text-cyan-200";
  }

  return theme === "light"
    ? "border border-slate-300 bg-slate-100 text-slate-700"
    : "border border-white/10 bg-slate-800 text-slate-200";
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector((state) => state.auth.user);
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskForm, setTaskForm] = useState<TaskInput>(emptyTask);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<SummaryPeriod>("day");
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [productivitySummary, setProductivitySummary] =
    useState<ProductivitySummaryResponse | null>(null);
  const [taskSummary, setTaskSummary] = useState<TaskSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  if (!currentUser) {
    return null;
  }

  const userId = currentUser.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    void loadTasks();
  }, [userId]);

  async function loadTasks() {
    if (!userId) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchTasks(userId);
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

    let streak = 0;
    const sortedByUpdated = [...tasks].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    for (const task of sortedByUpdated) {
      if (task.status !== "done") break;
      streak += 1;
    }

    return { total, done, inProgress, overdue, streak };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filter) {
      case "todo":
      case "in_progress":
      case "done":
        return tasks.filter((task) => task.status === filter);
      case "high_priority":
        return tasks.filter((task) => task.priority === "high");
      case "low_priority":
        return tasks.filter((task) => task.priority === "low");
      default:
        return tasks;
    }
  }, [filter, tasks]);

  const periodTasks = useMemo(() => tasks.filter((task) => isTaskInPeriod(task, period)), [period, tasks]);

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
        const updated = await updateTask(userId, editingId, payload);
        setTasks((current) => current.map((task) => (task.id === editingId ? updated : task)));
      } else {
        const created = await createTask(userId, payload);
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
    if (!userId) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteTask(userId, id);
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
    if (!userId) {
      return;
    }

    setSummaryLoading(true);
    setError(null);
    try {
      if (periodTasks.length === 0) {
        setProductivitySummary({
          period,
          summary: "No tasks are due within the selected period.",
          highlights: [],
          risks: [],
          nextSteps: []
        });
        setTaskSummary(await fetchTaskSummary(tasks));
        return;
      }

      const [productivity, taskSummaryResponse] = await Promise.all([
        fetchProductivitySummary(period, periodTasks),
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

  const filterButtons: Array<{ label: string; value: TaskFilter }> = [
    { label: "All", value: "all" },
    { label: "Todo", value: "todo" },
    { label: "In Progress", value: "in_progress" },
    { label: "Done", value: "done" },
    { label: "High Priority", value: "high_priority" },
    { label: "Low Priority", value: "low_priority" }
  ];

  return (
    <main className="theme-transition min-h-screen px-4 py-8 text-slate-900 dark:text-slate-100 light:text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="theme-transition rounded-3xl border p-6 backdrop-blur dark:border-white/10 dark:bg-white/5 dark:shadow-glow light:border-slate-300 light:bg-slate-50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="theme-transition text-sm uppercase tracking-[0.3em] dark:text-cyan-300/80 light:text-blue-600/80">
                Todoist SDLC
              </p>
              <h1 className="theme-transition mt-2 text-4xl font-semibold tracking-tight dark:text-white light:text-slate-900 sm:text-5xl">
                Ship tasks, inspect flow, and generate AI summaries.
              </h1>
              <p className="theme-transition mt-3 text-sm leading-6 dark:text-slate-300 light:text-slate-600">
                React frontend, Express CRUD API, and Gemini-powered agents for productivity and
                task intelligence.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border px-4 py-3 dark:border-white/10 dark:bg-white/5 light:border-slate-300 light:bg-white">
                <div className="text-xs uppercase tracking-[0.2em] dark:text-slate-400 light:text-slate-500">
                  Signed in as
                </div>
                <div className="mt-1 text-sm font-medium dark:text-white light:text-slate-900">
                  {currentUser?.displayName}
                </div>
                <div className="text-xs dark:text-slate-400 light:text-slate-500">
                  {currentUser?.email}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="theme-transition flex h-12 w-12 items-center justify-center rounded-full border text-xl dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 light:border-slate-300 light:bg-white light:hover:bg-slate-100"
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
              <button
                type="button"
                onClick={() => dispatch(logout())}
                className="theme-transition rounded-full border px-4 py-2 text-sm dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              ["Total", stats.total],
              ["Done", stats.done],
              ["In progress", stats.inProgress],
              ["Overdue", stats.overdue],
              ["🔥 Streak", stats.streak]
            ].map(([label, value]) => (
              <StatCard
                key={label as string}
                label={label as string}
                value={value as number}
                theme={theme}
              />
            ))}
          </div>
        </section>

        {error ? (
          <div className="theme-transition rounded-2xl border border-rose-500/30 px-4 py-3 text-sm dark:bg-rose-500/10 dark:text-rose-100 light:bg-rose-100 light:text-rose-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="theme-transition rounded-3xl border p-5 dark:border-white/10 dark:bg-slate-950/55 dark:shadow-glow light:border-slate-300 light:bg-slate-50">
            <div className="flex items-center justify-between">
              <h2 className="theme-transition text-xl font-semibold dark:text-white light:text-slate-900">
                {editingId ? "Edit task" : "Create task"}
              </h2>
              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="theme-transition rounded-full border px-3 py-1 text-sm dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100"
                >
                  Cancel
                </button>
              ) : null}
            </div>

            <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
              <input
                className="theme-transition w-full rounded-2xl border px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
                placeholder="Task title"
                value={taskForm.title}
                onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
                required
              />
              <textarea
                className="theme-transition min-h-28 w-full rounded-2xl border px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
                placeholder="Description"
                value={taskForm.description}
                onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <select
                  className="theme-transition rounded-2xl border px-4 py-3 outline-none focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
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
                  className="theme-transition rounded-2xl border px-4 py-3 outline-none focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
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
                  className="theme-transition rounded-2xl border px-4 py-3 outline-none focus:border-cyan-400/50 dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900 light:focus:border-blue-400"
                  value={taskForm.dueDate ?? ""}
                  onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="theme-transition rounded-2xl px-4 py-3 font-medium text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-cyan-400 light:bg-blue-500 light:text-white"
              >
                {saving ? "Saving..." : editingId ? "Update task" : "Create task"}
              </button>
            </form>

            <div className="mt-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="theme-transition text-lg font-semibold dark:text-white light:text-slate-900">
                  Task queue
                </h3>
                <button
                  type="button"
                  onClick={loadTasks}
                  className="theme-transition rounded-full border px-3 py-1 text-sm dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5 light:border-slate-300 light:text-slate-600 light:hover:bg-slate-100"
                >
                  Refresh
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {filterButtons.map((button) => {
                  const isActive = filter === button.value;
                  return (
                    <button
                      key={button.value}
                      type="button"
                      onClick={() => setFilter(button.value)}
                      className={`theme-transition rounded-full border px-3 py-1.5 text-sm font-medium ${
                        isActive
                          ? "dark:border-cyan-400/30 dark:bg-cyan-400/15 dark:text-cyan-200 light:border-blue-300 light:bg-blue-100 light:text-blue-700"
                          : "dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 light:border-slate-300 light:bg-white light:text-slate-600 light:hover:bg-slate-100"
                      }`}
                    >
                      {button.label}
                    </button>
                  );
                })}
              </div>

              {loading ? (
                <div className="theme-transition rounded-2xl border p-6 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 light:border-slate-300 light:bg-white light:text-slate-600">
                  Loading tasks...
                </div>
              ) : tasks.length === 0 ? (
                <div className="theme-transition rounded-2xl border border-dashed p-6 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 light:border-slate-300 light:bg-white light:text-slate-600">
                  No tasks yet. Create the first one above.
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="theme-transition rounded-2xl border border-dashed p-6 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 light:border-slate-300 light:bg-white light:text-slate-600">
                  No tasks match the selected filter.
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      theme={theme}
                      onEdit={startEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="theme-transition rounded-3xl border p-5 dark:border-white/10 dark:bg-slate-950/55 dark:shadow-glow light:border-slate-300 light:bg-slate-50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="theme-transition text-xl font-semibold dark:text-white light:text-slate-900">
                  AI summaries
                </h2>
                <p className="theme-transition text-sm dark:text-slate-400 light:text-slate-600">
                  Gemini-backed summaries from the agents service.
                </p>
              </div>
              <select
                className="theme-transition rounded-2xl border px-4 py-2 outline-none dark:border-white/10 dark:bg-white/5 dark:text-white light:border-slate-300 light:bg-white light:text-slate-900"
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
              className="theme-transition mt-4 rounded-2xl px-4 py-3 font-medium text-slate-950 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-emerald-400 light:bg-blue-500 light:text-white"
            >
              {summaryLoading ? "Generating..." : "Generate summaries"}
            </button>

            <div className="mt-5 grid gap-4">
              <SummaryCard
                theme={theme}
                title={`Productivity summary for ${periodLabels[period]}`}
                body={productivitySummary?.summary ?? "Run the agent to generate a productivity summary."}
                bullets={productivitySummary ? productivitySummary.highlights : []}
                secondary={productivitySummary ? productivitySummary.risks : []}
                tertiary={productivitySummary ? productivitySummary.nextSteps : []}
              />
              <SummaryCard
                theme={theme}
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

function StatCard({ label, value, theme }: { label: string; value: number; theme: Theme }) {
  return (
    <div className="theme-transition rounded-2xl border p-4 dark:border-white/10 dark:bg-slate-950/40 light:border-slate-300 light:bg-white">
      <div className="theme-transition text-xs uppercase tracking-[0.2em] dark:text-slate-400 light:text-slate-500">
        {label}
      </div>
      <div
        className={`theme-transition mt-2 text-3xl font-semibold ${
          theme === "light" ? "text-slate-900" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  theme,
  onEdit,
  onDelete
}: {
  task: Task;
  theme: Theme;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="theme-transition rounded-2xl border p-4 hover:border-cyan-400/30 dark:border-white/10 dark:bg-white/5 light:border-slate-300 light:bg-white light:hover:border-blue-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="theme-transition text-base font-semibold dark:text-white light:text-slate-900">
              {task.title}
            </h4>
            <span
              className={`theme-transition rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusBadgeClasses(task.status)}`}
            >
              {statusLabels[task.status]}
            </span>
            <span
              className={`theme-transition rounded-full px-2.5 py-1 text-xs font-medium ${getPriorityBadgeClasses(task.priority, theme)}`}
            >
              {priorityLabels[task.priority]}
            </span>
          </div>
          <p className="theme-transition mt-2 text-sm leading-6 dark:text-slate-300 light:text-slate-600">
            {task.description || "No description"}
          </p>
          <p className="theme-transition mt-2 text-xs dark:text-slate-400 light:text-slate-500">
            Due {formatDate(task.dueDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="theme-transition rounded-full border px-3 py-1 text-sm dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5 light:border-slate-300 light:text-slate-700 light:hover:bg-slate-100"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            className="theme-transition rounded-full border border-rose-500/20 px-3 py-1 text-sm dark:text-rose-200 dark:hover:bg-rose-500/10 light:bg-rose-50 light:text-rose-700 light:hover:bg-rose-100"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function SummaryCard({
  theme,
  title,
  body,
  bullets,
  secondary,
  tertiary
}: {
  theme: Theme;
  title: string;
  body: string;
  bullets: string[];
  secondary: string[];
  tertiary: string[];
}) {
  const sectionTitleClass = theme === "light" ? "text-slate-900" : "text-slate-100";

  return (
    <article className="theme-transition rounded-2xl border p-4 dark:border-white/10 dark:bg-white/5 light:border-slate-300 light:bg-white">
      <h3 className="theme-transition text-base font-semibold dark:text-white light:text-slate-900">
        {title}
      </h3>
      <p className="theme-transition mt-2 text-sm leading-6 dark:text-slate-300 light:text-slate-600">
        {body}
      </p>
      {bullets.length > 0 ? (
        <ul className="mt-4 space-y-2 text-sm dark:text-slate-200 light:text-slate-700">
          {bullets.map((item) => (
            <li
              key={item}
              className="theme-transition rounded-xl px-3 py-2 dark:bg-slate-900/60 light:bg-slate-100"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : null}
      {secondary.length > 0 ? (
        <div className="theme-transition mt-4 text-sm dark:text-slate-300 light:text-slate-600">
          <p className={`font-medium ${sectionTitleClass}`}>Risks / blockers</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {secondary.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {tertiary.length > 0 ? (
        <div className="theme-transition mt-4 text-sm dark:text-slate-300 light:text-slate-600">
          <p className={`font-medium ${sectionTitleClass}`}>Next steps</p>
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
