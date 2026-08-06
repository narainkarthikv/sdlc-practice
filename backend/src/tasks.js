import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "./db.js";

export const taskStatuses = ["todo", "in_progress", "done"];
export const taskPriorities = ["low", "medium", "high"];

export const taskInputSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().default(""),
  status: z.enum(taskStatuses).optional().default("todo"),
  priority: z.enum(taskPriorities).optional().default("medium"),
  dueDate: z.union([z.string(), z.null()]).optional().default(null)
});

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(taskStatuses).optional(),
  priority: z.enum(taskPriorities).optional(),
  dueDate: z.union([z.string(), z.null()]).optional()
});

function mapTask(row) {
  const dueDateValue = row.due_date
    ? row.due_date instanceof Date
      ? row.due_date.toISOString().slice(0, 10)
      : String(row.due_date).slice(0, 10)
    : null;
  const createdAtValue =
    row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
  const updatedAtValue =
    row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString();

  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: dueDateValue,
    createdAt: createdAtValue,
    updatedAt: updatedAtValue
  };
}

export async function listTasks(userId) {
  const result = await query(
    `
      select id, owner_id, title, description, status, priority, due_date, created_at, updated_at
      from tasks
      where owner_id = $1
      order by updated_at desc
    `,
    [userId]
  );
  return result.rows.map(mapTask);
}

export async function getTask(userId, id) {
  const result = await query(
    `
      select id, owner_id, title, description, status, priority, due_date, created_at, updated_at
      from tasks
      where id = $1 and owner_id = $2
    `,
    [id, userId]
  );
  return result.rows[0] ? mapTask(result.rows[0]) : null;
}

export async function createTask(userId, payload) {
  const data = taskInputSchema.parse(payload);
  const id = randomUUID();

  const result = await query(
    `
      insert into tasks (id, owner_id, title, description, status, priority, due_date, created_at, updated_at)
      values ($1, $2, $3, $4, $5, $6, $7, now(), now())
      returning id, owner_id, title, description, status, priority, due_date, created_at, updated_at
    `,
    [id, userId, data.title, data.description || null, data.status, data.priority, data.dueDate || null]
  );

  return mapTask(result.rows[0]);
}

export async function updateTask(userId, id, payload) {
  const data = taskUpdateSchema.parse(payload);
  const current = await getTask(userId, id);

  if (!current) {
    return null;
  }

  const next = {
    title: data.title ?? current.title,
    description: data.description ?? current.description ?? "",
    status: data.status ?? current.status,
    priority: data.priority ?? current.priority,
    dueDate: Object.prototype.hasOwnProperty.call(data, "dueDate") ? data.dueDate : current.dueDate
  };

  const result = await query(
    `
      update tasks
      set title = $3,
          description = $4,
          status = $5,
          priority = $6,
          due_date = $7,
          updated_at = now()
      where id = $1 and owner_id = $2
      returning id, owner_id, title, description, status, priority, due_date, created_at, updated_at
    `,
    [id, userId, next.title, next.description || null, next.status, next.priority, next.dueDate || null]
  );

  return mapTask(result.rows[0]);
}

export async function deleteTask(userId, id) {
  const result = await query("delete from tasks where id = $1 and owner_id = $2 returning id", [id, userId]);
  return result.rowCount > 0;
}

export async function deleteTasks(userId, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return 0;
  // delete only tasks owned by the user and return number deleted
  const result = await query(
    `delete from tasks where owner_id = $1 and id = any($2::uuid[]) returning id`,
    [userId, ids]
  );
  return result.rowCount;
}

export async function taskStats(userId) {
  const result = await query(`
    select
      count(*)::int as total,
      count(*) filter (where status = 'todo')::int as todo,
      count(*) filter (where status = 'in_progress')::int as in_progress,
      count(*) filter (where status = 'done')::int as done,
      count(*) filter (
        where status <> 'done' and due_date is not null and due_date < current_date
      )::int as overdue
    from tasks
    where owner_id = $1
  `, [userId]);

  return result.rows[0];
}
