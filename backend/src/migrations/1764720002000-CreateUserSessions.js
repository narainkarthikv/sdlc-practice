import { Table, TableColumn, TableIndex } from "typeorm";

export class CreateUserSessions1764720002000 {
  async up(queryRunner) {
    if (!(await queryRunner.hasTable("user_sessions"))) {
      await queryRunner.createTable(
        new Table({
          name: "user_sessions",
          columns: [
            new TableColumn({ name: "id", type: "uuid", isPrimary: true }),
            new TableColumn({ name: "user_id", type: "uuid" }),
            new TableColumn({ name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" }),
            new TableColumn({ name: "expires_at", type: "timestamp" })
          ],
          foreignKeys: [{
            name: "user_sessions_user_id_fkey",
            columnNames: ["user_id"],
            referencedTableName: "users",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE"
          }]
        })
      );
    }

    const sessions = await queryRunner.getTable("user_sessions");
    if (sessions && !sessions.indices.some((index) => index.name === "idx_user_sessions_user_id")) {
      await queryRunner.createIndex("user_sessions", new TableIndex({
        name: "idx_user_sessions_user_id",
        columnNames: ["user_id"]
      }));
    }
    if (sessions && !sessions.indices.some((index) => index.name === "idx_user_sessions_expires_at")) {
      await queryRunner.createIndex("user_sessions", new TableIndex({
        name: "idx_user_sessions_expires_at",
        columnNames: ["expires_at"]
      }));
    }
  }

  async down(queryRunner) {
    if (await queryRunner.hasTable("user_sessions")) {
      await queryRunner.dropTable("user_sessions");
    }
  }
}
