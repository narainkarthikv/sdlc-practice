import { Table, TableColumn, TableIndex } from "typeorm";

export class CreateTodoSchema1764720000000 {
  async up(queryRunner) {
    if (!(await queryRunner.hasTable("users"))) {
      await queryRunner.createTable(
        new Table({
          name: "users",
          columns: [
            new TableColumn({ name: "id", type: "uuid", isPrimary: true }),
            new TableColumn({ name: "display_name", type: "varchar", length: "120" }),
            new TableColumn({ name: "email", type: "varchar", length: "255", isUnique: true }),
            new TableColumn({ name: "password_hash", type: "varchar", length: "255" }),
            new TableColumn({ name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" }),
            new TableColumn({ name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" })
          ]
        })
      );
    }

    if (!(await queryRunner.hasTable("tasks"))) {
      await queryRunner.createTable(
        new Table({
          name: "tasks",
          columns: [
            new TableColumn({ name: "id", type: "uuid", isPrimary: true }),
            new TableColumn({ name: "owner_id", type: "uuid" }),
            new TableColumn({ name: "title", type: "varchar", length: "200" }),
            new TableColumn({ name: "description", type: "text", default: "''" }),
            new TableColumn({ name: "status", type: "varchar", length: "20" }),
            new TableColumn({ name: "priority", type: "varchar", length: "20" }),
            new TableColumn({ name: "due_date", type: "date", isNullable: true }),
            new TableColumn({ name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" }),
            new TableColumn({ name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" })
          ],
          foreignKeys: [
            {
              name: "tasks_owner_id_fkey",
              columnNames: ["owner_id"],
              referencedTableName: "users",
              referencedColumnNames: ["id"],
              onDelete: "CASCADE"
            }
          ],
          checks: [
            { name: "tasks_status_check", expression: "status IN ('todo', 'in_progress', 'done')" },
            { name: "tasks_priority_check", expression: "priority IN ('low', 'medium', 'high')" }
          ]
        })
      );
    }

    const users = await queryRunner.getTable("users");
    if (users && !users.indices.some((index) => index.name === "idx_users_email")) {
      await queryRunner.createIndex("users", new TableIndex({
        name: "idx_users_email",
        columnNames: ["email"],
        isUnique: false
      }));
    }

    const tasks = await queryRunner.getTable("tasks");
    if (tasks && !tasks.indices.some((index) => index.name === "idx_tasks_updated_at")) {
      await queryRunner.createIndex("tasks", new TableIndex({
        name: "idx_tasks_updated_at",
        columnNames: ["updated_at"],
        isUnique: false
      }));
    }
  }

  async down(queryRunner) {
    if (await queryRunner.hasTable("tasks")) await queryRunner.dropTable("tasks");
    if (await queryRunner.hasTable("users")) await queryRunner.dropTable("users");
  }
}
