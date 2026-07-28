import { z } from "zod";
import { getUserById } from "./users.js";

const userIdHeaderSchema = z.string().uuid();

function createHttpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}

export async function requireUser(req) {
  const rawUserId = req.header("x-user-id");
  if (!rawUserId) {
    throw createHttpError(401, "Missing user context");
  }

  const userId = userIdHeaderSchema.safeParse(rawUserId);
  if (!userId.success) {
    throw createHttpError(401, "Invalid user context");
  }

  const user = await getUserById(userId.data);
  if (!user) {
    throw createHttpError(401, "User not found");
  }

  return user;
}
