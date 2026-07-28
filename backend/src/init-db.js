import { query } from "./db.js";

export async function initializeDatabase() {
  try {
    const statements = [
      `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          display_name VARCHAR(120) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `,
      `
        CREATE TABLE IF NOT EXISTS tasks (
          id UUID PRIMARY KEY,
          owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(200) NOT NULL,
          description TEXT DEFAULT '',
          status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
          priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
          due_date DATE,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `,
      `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = 'tasks'
              AND column_name = 'owner_id'
          ) THEN
            ALTER TABLE tasks ADD COLUMN owner_id UUID;
          END IF;
        END
        $$;
      `,
      `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1
            FROM information_schema.table_constraints
            WHERE table_schema = 'public'
              AND table_name = 'tasks'
              AND constraint_name = 'tasks_owner_id_fkey'
          ) THEN
            ALTER TABLE tasks
              ADD CONSTRAINT tasks_owner_id_fkey
              FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;
          END IF;
        END
        $$;
      `,
      `CREATE INDEX IF NOT EXISTS idx_tasks_owner_updated_at ON tasks(owner_id, updated_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC)`
    ];

    for (const statement of statements) {
      await query(statement);
    }

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Database initialization error:", error.message);
    // Don't throw - allow server to start even if DB init fails
    // Individual queries will fail with proper error messages
  }
}
