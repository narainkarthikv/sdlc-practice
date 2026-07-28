import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { query } from "../db.js";

const defaultSaltRounds = 10;

export const signupSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200)
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(200)
});

function getSaltRounds() {
  const parsed = Number(process.env.BCRYPT_SALT_ROUNDS || defaultSaltRounds);
  return Number.isFinite(parsed) && parsed >= 4 ? Math.floor(parsed) : defaultSaltRounds;
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}

function mapUser(row) {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString(),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : new Date(row.updated_at).toISOString()
  };
}

export async function getUserById(id) {
  const result = await query(
    "select id, display_name, email, created_at, updated_at from users where id = $1",
    [id]
  );

  return result.rows[0] ? mapUser(result.rows[0]) : null;
}

export async function signupUser(payload) {
  const data = signupSchema.parse(payload);
  const existing = await query("select id from users where email = $1", [data.email]);

  if (existing.rowCount > 0) {
    throw createHttpError(409, "An account with this email already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, getSaltRounds());
  const userId = randomUUID();

  const result = await query(
    `
      insert into users (id, display_name, email, password_hash, created_at, updated_at)
      values ($1, $2, $3, $4, now(), now())
      returning id, display_name, email, created_at, updated_at
    `,
    [userId, data.displayName, data.email, passwordHash]
  );

  return {
    user: mapUser(result.rows[0]),
    sessionId: randomUUID()
  };
}

export async function loginUser(payload) {
  const data = loginSchema.parse(payload);
  const result = await query(
    "select id, display_name, email, password_hash, created_at, updated_at from users where email = $1",
    [data.email]
  );

  const userRow = result.rows[0];
  if (!userRow) {
    throw createHttpError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(data.password, userRow.password_hash);
  if (!passwordMatches) {
    throw createHttpError(401, "Invalid email or password");
  }

  return {
    user: mapUser(userRow),
    sessionId: randomUUID()
  };
}
