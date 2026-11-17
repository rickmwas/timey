import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";

afterAll(async () => {
  await db.$disconnect();
});

describe("PostgreSQL integration", () => {
  it("connects to the configured database and has the backend tables", async () => {
    const [connection] = await db.$queryRaw<Array<{ database: string; result: number }>>`
      SELECT current_database() AS database, 1 AS result
    `;
    const tables = await db.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'ScheduleOverride',
          'ScheduleChange',
          'Notification',
          'ImportJob',
          'StagedTimetableEntry',
          'Announcement'
        )
    `;

    expect(connection.result).toBe(1);
    expect(connection.database).toBe("timy_test");
    expect(tables.map(({ table_name }) => table_name).sort()).toEqual([
      "Announcement",
      "ImportJob",
      "Notification",
      "ScheduleChange",
      "ScheduleOverride",
      "StagedTimetableEntry",
    ]);
  });
});