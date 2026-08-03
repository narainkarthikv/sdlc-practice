import { TableColumn, TableForeignKey, TableIndex } from "typeorm";

export class AddTaskOwnershipIndex1764720001000 {
  async up(queryRunner) {
    const tasks = await queryRunner.getTable("tasks");
    if (!tasks) return;

    if (!tasks.findColumnByName("owner_id")) {
      await queryRunner.addColumn("tasks", new TableColumn({
        name: "owner_id",
        type: "uuid",
        isNullable: true
      }));
    }

    const refreshedTasks = await queryRunner.getTable("tasks");
    if (!refreshedTasks.foreignKeys.some((key) => key.name === "tasks_owner_id_fkey")) {
      await queryRunner.createForeignKey("tasks", new TableForeignKey({
        name: "tasks_owner_id_fkey",
        columnNames: ["owner_id"],
        referencedTableName: "users",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE"
      }));
    }

    if (!refreshedTasks.indices.some((index) => index.name === "idx_tasks_owner_updated_at")) {
      await queryRunner.createIndex("tasks", new TableIndex({
        name: "idx_tasks_owner_updated_at",
        columnNames: ["owner_id", "updated_at"],
        isUnique: false
      }));
    }
  }

  async down(queryRunner) {
    const tasks = await queryRunner.getTable("tasks");
    if (!tasks) return;
    const index = tasks.indices.find((item) => item.name === "idx_tasks_owner_updated_at");
    if (index) await queryRunner.dropIndex("tasks", index);
    const foreignKey = tasks.foreignKeys.find((item) => item.name === "tasks_owner_id_fkey");
    if (foreignKey) await queryRunner.dropForeignKey("tasks", foreignKey);
    if (tasks.findColumnByName("owner_id")) await queryRunner.dropColumn("tasks", "owner_id");
  }
}
