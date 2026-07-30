import { OAuth2Client } from "google-auth-library";

const authClient = new OAuth2Client();

function createHttpError(status, message) {
  const error = new Error(message);
  error.statusCode = status;
  return error;
}

function isTruthy(value) {
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function isFalsey(value) {
  return ["0", "false", "no", "off"].includes(String(value).trim().toLowerCase());
}

function shouldRequireServiceAuth() {
  if (process.env.SERVICE_TO_SERVICE_AUTH && isFalsey(process.env.SERVICE_TO_SERVICE_AUTH)) {
    return false;
  }

  if (process.env.SERVICE_TO_SERVICE_AUTH && isTruthy(process.env.SERVICE_TO_SERVICE_AUTH)) {
    return true;
  }

  return Boolean(process.env.K_SERVICE);
}

function getExpectedAudience(req) {
  const forwardedProto = req.header("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || (req.secure ? "https" : "http");
  const host = req.header("host");

  return host ? `${protocol}://${host}` : null;
}

function getBearerToken(req) {
  const authorization = req.header("authorization");
  if (!authorization) {
    return null;
  }

  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token.trim();
}

export async function requireServiceCaller(req) {
  if (!shouldRequireServiceAuth() || req.path === "/healthz") {
    return null;
  }

  const token = getBearerToken(req);
  if (!token) {
    throw createHttpError(401, "Missing service identity");
  }

  const audience = getExpectedAudience(req);
  if (!audience) {
    throw createHttpError(401, "Missing service audience");
  }

  try {
    const ticket = await authClient.verifyIdToken({
      idToken: token,
      audience
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw createHttpError(401, "Invalid service identity");
    }

    req.serviceCaller = {
      email: payload.email ?? null,
      subject: payload.sub ?? null,
      audience: payload.aud ?? null
    };

    return req.serviceCaller;
  } catch {
    throw createHttpError(401, "Invalid service identity");
  }
}
