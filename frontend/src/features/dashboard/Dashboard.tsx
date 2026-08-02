import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
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
  todo: "To do",
  in_progress: "In progress",
  done: "Completed"
};

const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

const periodLabels: Record<SummaryPeriod, string> = {
  day: "Today",
  week: "This week",
  month: "This month",
  year: "This year"
};

type TaskFilter = "all" | TaskStatus | "high_priority" | "low_priority";
type Theme = "light" | "dark";

function formatDate(value: string | null): string {
  if (!value) return "No due date";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(value));
}

function formatToday(): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date());
}

function getPeriodWindowDays(period: SummaryPeriod): number {
  switch (period) {
    case "day": return 1;
    case "week": return 7;
    case "month": return 30;
    case "year": return 365;
    default: return 7;
  }
}

function isTaskInPeriod(task: Task, period: SummaryPeriod, now = new Date()): boolean {
  if (!task.dueDate) return false;
  const dueDate = new Date(`${task.dueDate}T00:00:00`);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + getPeriodWindowDays(period) - 1);
  end.setHours(23, 59, 59, 999);
  return dueDate >= start && dueDate <= end;
}

function getMutationErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Something went wrong";
  if ("data" in error && typeof (error as { data?: unknown }).data === "object") {
    const data = (error as { data?: { message?: unknown } }).data;
    if (typeof data?.message === "string") return data.message;
  }
  if ("error" in error && typeof (error as { error?: unknown }).error === "string") {
    return (error as { error: string }).error;
  }
  return "Something went wrong";
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
  const [productivitySummary, setProductivitySummary] = useState<ProductivitySummaryResponse | null>(null);
  const [taskSummary, setTaskSummary] = useState<TaskSummaryResponse | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const userId = currentUser?.id;

  useEffect(() => {
    document.title = "Workspace | Todoist SDLC";
  }, []);

  useEffect(() => {
    if (!insightsOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setInsightsOpen(false);
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [insightsOpen]);

  useEffect(() => {
    if (userId) void loadTasks();
  }, [userId]);

  async function loadTasks() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      setTasks(await fetchTasks(userId));
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

  const periodTasks = useMemo(
    () => tasks.filter((task) => isTaskInPeriod(task, period)),
    [period, tasks]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!userId) return;
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
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!userId) return;
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setTaskForm(emptyTask);
    setEditingId(null);
  }

  function goToOverview() {
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function generateSummaries() {
    if (!userId) return;
    setSummaryLoading(true);
    setError(null);
    try {
      if (periodTasks.length === 0) {
        setProductivitySummary({ period, summary: "No tasks are due within the selected period.", highlights: [], risks: [], nextSteps: [] });
        setTaskSummary(await fetchTaskSummary(period, periodTasks));
        return;
      }
      const [productivity, taskSummaryResponse] = await Promise.all([
        fetchProductivitySummary(period, periodTasks),
        fetchTaskSummary(period, periodTasks)
      ]);
      setProductivitySummary(productivity);
      setTaskSummary(taskSummaryResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate summaries");
    } finally {
      setSummaryLoading(false);
    }
  }

  if (!currentUser) return null;

  const filterButtons: Array<{ label: string; value: TaskFilter }> = [
    { label: "All tasks", value: "all" },
    { label: "To do", value: "todo" },
    { label: "In progress", value: "in_progress" },
    { label: "Completed", value: "done" },
    { label: "High priority", value: "high_priority" }
  ];

  return (
    <div className="app-shell theme-transition">
      <aside className={`workspace-sidebar ${mobileNavOpen ? "workspace-sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark"><CheckIcon /></div>
          <div><strong>Todoist</strong><span>SDLC workspace</span></div>
          <button className="mobile-close" onClick={() => setMobileNavOpen(false)} aria-label="Close navigation"><CloseIcon /></button>
        </div>

        <nav className="workspace-nav" aria-label="Workspace navigation">
          <p className="nav-label">Workspace</p>
          <button className="nav-item nav-item-active" onClick={goToOverview} aria-current="page"><GridIcon /> Overview <span className="nav-current" /></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <div className="upgrade-icon"><SparkIcon /></div>
            <strong>Make every week count</strong>
            <span>Turn your task list into a clear plan with AI.</span>
          </div>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="mobile-menu" onClick={() => setMobileNavOpen(true)} aria-label="Open navigation"><MenuIcon /></button>
          <div className="topbar-actions">
            <button className="icon-button" onClick={toggleTheme} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>{theme === "light" ? <MoonIcon /> : <SunIcon />}</button>
            <button className={`icon-button insights-toggle ${insightsOpen ? "insights-toggle-active" : ""}`} onClick={() => setInsightsOpen((open) => !open)} aria-label={`${insightsOpen ? "Close" : "Open"} AI insights`} aria-pressed={insightsOpen}><SparkIcon /></button>
            <div className="topbar-divider" />
            <div className="profile-menu">
              <button className="profile-button" onClick={() => setProfileOpen((open) => !open)} aria-label="Open profile" aria-expanded={profileOpen}><div className="avatar avatar-small">{getInitials(currentUser.displayName)}</div></button>
              {profileOpen ? <div className="profile-popover"><strong>{currentUser.displayName}</strong><span>{currentUser.email}</span><button onClick={() => dispatch(logout())}><LogoutIcon /> Sign out</button></div> : null}
            </div>
          </div>
        </header>

        <main className="workspace-content">
          {error ? <div className="alert alert-error"><AlertIcon /> <span>{error}</span><button onClick={() => setError(null)} aria-label="Dismiss error"><CloseIcon /></button></div> : null}

          <section className="hero-row">
            <div className="greeting-stack">
              <section className="greeting-card page-heading">
                <div>
                  <p className="eyebrow">{formatToday()}</p>
                  <h1>Good morning, {currentUser.displayName.split(" ")[0]} <span className="heading-wave">✦</span></h1>
                  <p className="page-subtitle">Here is what is happening across your workspace today.</p>
                </div>
              </section>
              <section className="glance-card">
                <div className="greeting-footer">
                <div className="greeting-footer-heading"><span>Today at a glance</span><strong>{stats.total ? `${Math.round((stats.done / stats.total) * 100)}% complete` : "Ready to begin"}</strong></div>
                <div className="greeting-progress"><span style={{ width: `${stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%` }} /></div>
                <div className="greeting-meta"><span><i className="greeting-dot greeting-dot-brand" />{stats.inProgress} in progress</span><span><i className="greeting-dot greeting-dot-success" />{stats.done} completed</span><span>{stats.overdue ? `${stats.overdue} overdue` : "No overdue tasks"}</span></div>
                </div>
              </section>
            </div>

            <section className="stats-grid" aria-label="Task overview">
              <StatCard label="Total tasks" value={stats.total} icon={<GridIcon />} tone="blue" />
              <StatCard label="Completed" value={stats.done} icon={<CheckIcon />} tone="green" />
              <StatCard label="In progress" value={stats.inProgress} icon={<ClockIcon />} tone="orange" />
              <StatCard label="Overdue" value={stats.overdue} icon={<AlertIcon />} tone="red" />
            </section>
          </section>

          <div className="dashboard-grid">
            <section id="task-queue" className="panel task-panel">
              <div className="panel-header">
                <div><p className="panel-kicker">Your workspace</p><h2>Task queue</h2></div>
                <div className="panel-header-actions"><button type="submit" form="task-form" className="button button-primary header-submit" disabled={saving}>{saving ? "Saving..." : editingId ? "Save changes" : "Add task"}</button><button className="icon-button panel-refresh" onClick={loadTasks} aria-label="Refresh tasks"><RefreshIcon /></button></div>
              </div>

              <form id="task-form" className={`task-composer ${editingId ? "task-composer-editing" : ""}`} onSubmit={handleSubmit}>
                <div className="composer-title-row"><input id="task-composer" aria-label="Task title" placeholder={editingId ? "Update task title..." : "What needs to be done?"} value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} required /></div>
                <textarea rows={1} aria-label="Task description" placeholder="Add a note or description (optional)" value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
                <div className="composer-footer">
                  <div className="composer-fields">
                    <label className="field-chip"><CalendarIcon /><input type="date" aria-label="Due date" value={taskForm.dueDate ?? ""} onChange={(event) => setTaskForm({ ...taskForm, dueDate: event.target.value })} /></label>
                    <label className="field-chip"><FlagIcon /><select aria-label="Priority" value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value as TaskPriority })}>{Object.entries(priorityLabels).map(([value, label]) => <option key={value} value={value}>{label} priority</option>)}</select></label>
                    {editingId ? <label className="field-chip"><ClockIcon /><select aria-label="Status" value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value as TaskStatus })}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label> : null}
                  </div>
                  <div className="composer-actions">{editingId ? <button type="button" className="button button-ghost" onClick={resetForm}>Cancel</button> : null}</div>
                </div>
              </form>

              <div className="queue-toolbar"><div className="filter-tabs">{filterButtons.map((button) => <button key={button.value} className={filter === button.value ? "filter-tab filter-tab-active" : "filter-tab"} onClick={() => setFilter(button.value)}>{button.label}{button.value === "all" ? <span>{tasks.length}</span> : null}</button>)}</div><span className="queue-count">{filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}</span></div>

              <div className="task-list">
                {loading ? <div className="empty-state"><span className="loading-dot" /> Loading your tasks...</div> : tasks.length === 0 ? <div className="empty-state"><div className="empty-icon"><CheckIcon /></div><strong>Your queue is clear</strong><span>Create your first task above to get started.</span></div> : filteredTasks.length === 0 ? <div className="empty-state"><strong>No matching tasks</strong><span>Try another filter to see more of your work.</span></div> : filteredTasks.map((task) => <TaskCard key={task.id} task={task} theme={theme} onEdit={startEdit} onDelete={handleDelete} />)}
              </div>
            </section>

          </div>

          {insightsOpen ? <>
            <button className="insights-backdrop" onClick={() => setInsightsOpen(false)} aria-label="Close AI insights" />
            <aside className="insights-drawer" role="dialog" aria-modal="true" aria-labelledby="insights-title">
              <div className="drawer-header"><div><p className="panel-kicker panel-kicker-purple">Powered by Gemini</p><h2 id="insights-title">AI insights</h2></div><button className="icon-button" onClick={() => setInsightsOpen(false)} aria-label="Close AI insights"><CloseIcon /></button></div>
              <div className="insight-intro"><div className="insight-orb"><SparkIcon /></div><div><strong>See the bigger picture.</strong><p>Get a focused read on your workload and what to do next.</p></div></div>
              <div className="period-selector"><span>Focus period</span><select value={period} onChange={(event) => setPeriod(event.target.value as SummaryPeriod)}>{Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <button className="button insight-button" onClick={generateSummaries} disabled={summaryLoading || tasks.length === 0}><SparkIcon /> {summaryLoading ? "Analyzing your tasks..." : "Generate insights"}<ArrowIcon /></button>
              <div className="summary-stack"><SummaryCard title={`Productivity · ${periodLabels[period]}`} body={productivitySummary?.summary ?? "Generate an insight to see your productivity outlook."} bullets={productivitySummary?.highlights ?? []} secondary={productivitySummary?.risks ?? []} tertiary={productivitySummary?.nextSteps ?? []} /><SummaryCard title="Task health" body={taskSummary?.summary ?? "Your task health summary will appear here."} bullets={taskSummary ? [`${taskSummary.breakdown.todo} to do`, `${taskSummary.breakdown.in_progress} in progress`, `${taskSummary.breakdown.done} completed`] : []} secondary={taskSummary?.blockers ?? []} tertiary={taskSummary?.recommendations ?? []} /></div>
            </aside>
          </> : null}
        </main>
      </div>
    </div>
  );
}

function getInitials(name: string): string {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function StatCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: string }) {
  return <article className={`stat-card stat-${tone}`}><div className="stat-top"><span>{label}</span><div className="stat-icon">{icon}</div></div><strong>{value}</strong></article>;
}

function TaskCard({ task, theme, onEdit, onDelete }: { task: Task; theme: Theme; onEdit: (task: Task) => void; onDelete: (id: string) => void }) {
  return <article className={`task-row ${task.status === "done" ? "task-row-done" : ""}`}><div className={`task-check task-check-${task.status}`} aria-label={statusLabels[task.status]}>{task.status === "done" ? <CheckIcon /> : task.status === "in_progress" ? <span /> : null}</div><div className="task-row-main"><div className="task-row-title"><strong>{task.title}</strong><span className={`status-pill status-${task.status}`}>{statusLabels[task.status]}</span><span className={`priority-pill priority-${task.priority}`}><FlagIcon /> {priorityLabels[task.priority]}</span></div><p>{task.description || "No description added"}</p><span className="task-due"><CalendarIcon /> {formatDate(task.dueDate)}</span></div><div className="task-row-actions"><button onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}><EditIcon /></button><button className="delete-action" onClick={() => onDelete(task.id)} aria-label={`Delete ${task.title}`}><TrashIcon /></button></div></article>;
}

function SummaryCard({ title, body, bullets, secondary, tertiary }: { title: string; body: string; bullets: string[]; secondary: string[]; tertiary: string[] }) {
  return <article className="summary-card"><h3>{title}</h3><p>{body}</p>{bullets.length > 0 ? <ul className="summary-highlights">{bullets.slice(0, 3).map((item) => <li key={item}><span><CheckIcon /></span>{item}</li>)}</ul> : null}{secondary.length > 0 ? <div className="summary-section summary-risk"><strong>Watch out for</strong>{secondary.slice(0, 2).map((item) => <span key={item}>{item}</span>)}</div> : null}{tertiary.length > 0 ? <div className="summary-section"><strong>Next best steps</strong>{tertiary.slice(0, 2).map((item) => <span key={item}>{item}</span>)}</div> : null}</article>;
}

type IconProps = { size?: number };
function Icon({ children, size = 18 }: IconProps & { children: ReactNode }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>; }
const CheckIcon = ({ size }: IconProps) => <Icon size={size}><path d="m5 12 4 4L19 6" /></Icon>;
const PlusIcon = ({ size }: IconProps) => <Icon size={size}><path d="M12 5v14M5 12h14" /></Icon>;
const GridIcon = ({ size }: IconProps) => <Icon size={size}><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></Icon>;
const SparkIcon = ({ size }: IconProps) => <Icon size={size}><path d="m12 3-1.5 5.5L5 10l5.5 1.5L12 17l1.5-5.5L19 10l-5.5-1.5L12 3Z" /><path d="m19 16-.6 2.4L16 19l2.4.6L19 22l.6-2.4L22 19l-2.4-.6L19 16Z" /></Icon>;
const CalendarIcon = ({ size }: IconProps) => <Icon size={size}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></Icon>;
const SettingsIcon = ({ size }: IconProps) => <Icon size={size}><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" /><path d="m19.4 15 .1.1a2 2 0 0 1-2.8 2.8l-.1-.1a2 2 0 0 0-3.4 1.4v.3a2 2 0 0 1-4 0v-.2a2 2 0 0 0-3.4-1.5l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A2 2 0 0 0 3.6 12a2 2 0 0 0-1.4-3.4h-.3a2 2 0 0 1 0-4h.2A2 2 0 0 0 3.6 1.2l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A2 2 0 0 0 10 3.6a2 2 0 0 0 3.4-1.4v-.3a2 2 0 0 1 4 0v.2a2 2 0 0 0 3.4 1.5l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1A2 2 0 0 0 20.4 10a2 2 0 0 0 1.4 3.4h.3a2 2 0 0 1 0 4h-.2a2 2 0 0 0-2.5-2.4Z" /></Icon>;
const ChevronIcon = ({ size }: IconProps) => <Icon size={size}><path d="m9 18 6-6-6-6" /></Icon>;
const ArrowIcon = ({ size }: IconProps) => <Icon size={size}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
const MoonIcon = ({ size }: IconProps) => <Icon size={size}><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></Icon>;
const SunIcon = ({ size }: IconProps) => <Icon size={size}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
const RefreshIcon = ({ size }: IconProps) => <Icon size={size}><path d="M20 11a8 8 0 0 0-14.8-4L3 10" /><path d="M3 5v5h5M4 13a8 8 0 0 0 14.8 4L21 14" /><path d="M21 19v-5h-5" /></Icon>;
const ClockIcon = ({ size }: IconProps) => <Icon size={size}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Icon>;
const FlagIcon = ({ size }: IconProps) => <Icon size={size}><path d="M5 21V4M5 5c4-3 6 3 14 0v9c-8 3-10-3-14 0" /></Icon>;
const EditIcon = ({ size }: IconProps) => <Icon size={size}><path d="m4 16-.8 4.8L8 20l11.5-11.5a2.1 2.1 0 0 0-3-3L5 17Z" /><path d="m14.5 7.5 3 3" /></Icon>;
const TrashIcon = ({ size }: IconProps) => <Icon size={size}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></Icon>;
const AlertIcon = ({ size }: IconProps) => <Icon size={size}><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17h.01" /></Icon>;
const LogoutIcon = ({ size }: IconProps) => <Icon size={size}><path d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-5" /></Icon>;
const MenuIcon = ({ size }: IconProps) => <Icon size={size}><path d="M4 6h16M4 12h16M4 18h16" /></Icon>;
const CloseIcon = ({ size }: IconProps) => <Icon size={size}><path d="m6 6 12 12M18 6 6 18" /></Icon>;
