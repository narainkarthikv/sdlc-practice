export function getMutationErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") return "Something went wrong";

  if ("data" in error && typeof error.data === "object" && error.data !== null) {
    const message = (error.data as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }

  if ("error" in error && typeof error.error === "string") return error.error;
  return "Something went wrong";
}
