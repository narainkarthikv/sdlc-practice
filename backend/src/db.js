import pg from "pg";
import { Connector } from "@google-cloud/cloud-sql-connector";

const { Pool } = pg;

let poolPromise;
let connector;

function getDefaultRole() {
  return process.env.DB_ROLE || "todo_developer";
}

function getConnectionMode() {
  return (process.env.DB_CONNECTION_MODE || "proxy").toLowerCase();
}

function requireDbCredentials() {
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  if (!user || !database) {
    throw new Error("DB_USER and DB_NAME are required");
  }

  return { user, database };
}

function getIpType() {
  return process.env.PRIVATE_IP === "1" || process.env.PRIVATE_IP === "true"
    ? "PRIVATE"
    : "PUBLIC";
}

function quoteIdentifier(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`;
}

function buildRoleSetupQuery() {
  return `set role ${quoteIdentifier(getDefaultRole())}`;
}

function buildProxyPoolConfig() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const port = Number(process.env.DB_PORT || 5432);
  const { user, database } = requireDbCredentials();

  return {
    host,
    port,
    user,
    database,
    ssl:
      host === "127.0.0.1" || host === "localhost" || process.env.PGSSLMODE === "disable"
        ? false
        : process.env.PGSSLMODE === "require" || process.env.PGSSL === "true"
          ? { rejectUnauthorized: false }
          : false
  };
}

async function buildConnectorPoolConfig() {
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  if (!instanceConnectionName) {
    throw new Error("INSTANCE_CONNECTION_NAME is required for connector mode");
  }

  const { user, database } = requireDbCredentials();
  connector = new Connector();
  const clientOpts = await connector.getOptions({
    instanceConnectionName,
    authType: "IAM",
    ipType: getIpType()
  });

  return {
    ...clientOpts,
    user,
    database
  };
}

async function createPool() {
  const mode = getConnectionMode();
  const config = mode === "connector" ? await buildConnectorPoolConfig() : buildProxyPoolConfig();
  const pool = new Pool(config);

  pool.on("connect", (client) => {
    client.roleReadyPromise = client.query(buildRoleSetupQuery());
  });

  return pool;
}

export async function getPool() {
  if (!poolPromise) {
    poolPromise = createPool();
  }

  return poolPromise;
}

export async function query(text, params) {
  const pool = await getPool();
  const client = await pool.connect();

  try {
    await client.roleReadyPromise;
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function ensureDbConnection() {
  // Use the same client flow as application queries so a newly connected
  // client finishes SET ROLE before the health check starts its query.
  await query("select 1");
}

export async function closeDb() {
  if (poolPromise) {
    const pool = await poolPromise;
    await pool.end();
    poolPromise = undefined;
  }

  if (connector) {
    await connector.close();
    connector = undefined;
  }
}
