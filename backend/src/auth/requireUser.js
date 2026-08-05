import { z } from "zod";
import { query } from "../db.js";
const sessionIdSchema = z.string().uuid();

function createHttpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}

export async function requireUser(req) {
  const rawSessionId = req.header("x-session-id");
  if (!rawSessionId) {
    throw createHttpError(401, "Missing session");
  }

  const sessionId = sessionIdSchema.safeParse(rawSessionId);
  if (!sessionId.success) {
    throw createHttpError(401, "Invalid session");
  }

  const result = await query(
    `
      select u.id, u.display_name, u.email, u.created_at, u.updated_at
      from user_sessions s
      join users u on u.id = s.user_id
      where s.id = $1 and s.expires_at > now()
    `,
    [sessionId.data]
  );

  if (!result.rows[0]) {
    throw createHttpError(401, "Session expired or invalid");
  }

  return {
    id: result.rows[0].id,
    displayName: result.rows[0].display_name,
    email: result.rows[0].email,
    createdAt: new Date(result.rows[0].created_at).toISOString(),
    updatedAt: new Date(result.rows[0].updated_at).toISOString()
  };
}
