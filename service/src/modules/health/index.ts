import { Elysia } from "elysia";
import { sql } from "../../lib/db.ts";

export const health = new Elysia({ name: "module.health" }).get(
  "/health",
  async () => {
    const [{ now }] = await sql`SELECT now()`;
    return {
      ok: true,
      dbTime: now,
    };
  },
);
