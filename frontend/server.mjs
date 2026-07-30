import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.env.PORT || 8080);
const distDir = resolve("dist");
const backendServiceUrl = normalizeServiceUrl(process.env.BACKEND_SERVICE_URL || "/api");
const agentsServiceUrl = normalizeServiceUrl(process.env.AGENTS_SERVICE_URL || "/agents");
const runtimeApiBaseUrl = process.env.PUBLIC_API_BASE_URL || "/api";
const runtimeAgentBaseUrl = process.env.PUBLIC_AGENT_BASE_URL || "/agents";
const identityTokenCache = new Map();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
};

function normalizeServiceUrl(value) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function buildRuntimeConfigScript() {
  return `window.__APP_CONFIG__ = ${JSON.stringify({
    VITE_API_BASE_URL: runtimeApiBaseUrl,
    VITE_AGENT_BASE_URL: runtimeAgentBaseUrl
  })};\n`;
}

async function getIdentityToken(audience) {
  const cached = identityTokenCache.get(audience);
  const now = Date.now();
  if (cached && cached.expiresAt > now + 60_000) {
    return cached.token;
  }

  const response = await fetch(
    `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}&format=full`,
    {
      headers: {
        "Metadata-Flavor": "Google"
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to mint identity token for ${audience}: ${response.status}`);
  }

  const token = await response.text();
  const payload = JSON.parse(base64UrlDecode(token.split(".")[1] || ""));
  const expiresAt = typeof payload.exp === "number" ? payload.exp * 1000 : now + 10 * 60 * 1000;
  identityTokenCache.set(audience, { token, expiresAt });
  return token;
}

function isHopByHopHeader(name) {
  return [
    "connection",
    "content-length",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade"
  ].includes(name.toLowerCase());
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function proxyRequest(request, response, targetUrl) {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  const upstreamUrl = new URL(
    requestUrl.pathname.replace(/^\/(api|agents)/, "") + requestUrl.search,
    targetUrl
  );
  const headers = new Headers();

  for (const [name, value] of Object.entries(request.headers)) {
    if (!value || isHopByHopHeader(name)) {
      continue;
    }

    headers.set(name, Array.isArray(value) ? value.join(",") : value);
  }

  headers.set("authorization", `Bearer ${await getIdentityToken(targetUrl)}`);

  const method = request.method || "GET";
  const body =
    method === "GET" || method === "HEAD" || method === "OPTIONS"
      ? undefined
      : await readRequestBody(request);

  const upstreamInit = {
    method,
    headers
  };

  if (body) {
    upstreamInit.body = body;
    upstreamInit.duplex = "half";
  }

  const upstreamResponse = await fetch(upstreamUrl, upstreamInit);

  response.statusCode = upstreamResponse.status;
  for (const [name, value] of upstreamResponse.headers) {
    if (!isHopByHopHeader(name)) {
      response.setHeader(name, value);
    }
  }

  const responseBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
  response.end(responseBuffer);
}

async function serveStaticFile(response, filePath) {
  const data = await readFile(filePath);
  response.statusCode = 200;
  response.setHeader("content-type", contentTypes[extname(filePath)] || "application/octet-stream");
  response.end(data);
}

async function handleRequest(request, response) {
  const requestUrl = new URL(request.url || "/", "http://localhost");

  if (requestUrl.pathname === "/healthz") {
    response.statusCode = 200;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ ok: true }));
    return;
  }

  if (requestUrl.pathname === "/runtime-config.js") {
    response.statusCode = 200;
    response.setHeader("content-type", "application/javascript; charset=utf-8");
    response.end(buildRuntimeConfigScript());
    return;
  }

  if (requestUrl.pathname.startsWith("/api/") || requestUrl.pathname === "/api") {
    await proxyRequest(request, response, backendServiceUrl);
    return;
  }

  if (requestUrl.pathname.startsWith("/agents/") || requestUrl.pathname === "/agents") {
    await proxyRequest(request, response, agentsServiceUrl);
    return;
  }

  const normalizedPath =
    requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname.replace(/\/+$/, "");
  const candidatePath = resolve(join(distDir, `.${normalizedPath}`));
  const insideDist = candidatePath.startsWith(distDir);

  try {
    if (insideDist) {
      const fileInfo = await stat(candidatePath);
      if (fileInfo.isFile()) {
        await serveStaticFile(response, candidatePath);
        return;
      }
    }
  } catch {
    // Fall through to SPA index.
  }

  await serveStaticFile(response, join(distDir, "index.html"));
}

createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error(error);
    response.statusCode = 500;
    response.setHeader("content-type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ message: "Internal server error" }));
  });
}).listen(port, () => {
  console.log(`Frontend server listening on ${port}`);
});
