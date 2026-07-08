-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  due_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON tasks(updated_at DESC);

-- Grant permissions to application user (uncomment and update with your username)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO "your_app_user";
