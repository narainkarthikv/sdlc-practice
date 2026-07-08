import { query } from "./db.js";

export async function initializeDatabase() {
  try {
    // Check if tasks table exists
    const result = await query(
      `SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'tasks'
      )`
    );
    
    const tableExists = result.rows[0].exists;
    
    if (!tableExists) {
      // Try to create tasks table
      try {
        await query(`
          CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY,
            title VARCHAR(200) NOT NULL,
            description TEXT DEFAULT '',
            status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
            priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
            due_date DATE,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create index for updated_at
        await query(`
          CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC)
        `);

        console.log("Database initialized successfully");
      } catch (createError) {
        if (createError.code === "42501") {
          // Permission denied - table needs to be created manually
          console.warn(
            "Database table creation requires elevated privileges. " +
            "Please run: psql -h DB_HOST -U admin -d DB_NAME < schema.sql"
          );
          console.warn(
            "For now, attempting to continue with current user permissions."
          );
        } else {
          throw createError;
        }
      }
    } else {
      console.log("Tasks table already exists");
    }
  } catch (error) {
    console.error("Database initialization error:", error.message);
    // Don't throw - allow server to start even if DB init fails
    // Individual queries will fail with proper error messages
  }
}

