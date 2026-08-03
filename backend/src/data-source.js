import "dotenv/config";
import { DataSource } from "typeorm";

function getRoleOptions() {
  const role = process.env.DB_ROLE || "todo_developer";

  // Connect with DB_USER, then execute migrations under the application role.
  // PostgreSQL's startup options apply SET ROLE before migrations execute.
  return `-c role=${role}`;
}

function getConnectionOptions() {
  const host = process.env.DB_HOST || "127.0.0.1";
  const roleOptions = getRoleOptions();
  const options = {
    type: "postgres",
    host,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    database: process.env.DB_NAME,
    migrations: ["src/migrations/*.js"],
    migrationsTableName: "typeorm_migrations",
    synchronize: false,
    logging: process.env.TYPEORM_LOGGING === "true"
  };

  if (roleOptions) options.extra = { options: roleOptions };

  if (host !== "127.0.0.1" && host !== "localhost" && process.env.PGSSLMODE !== "disable") {
    options.ssl = process.env.PGSSLMODE === "require" || process.env.PGSSL === "true"
      ? { rejectUnauthorized: false }
      : false;
  }

  return options;
}

export default new DataSource(getConnectionOptions());
