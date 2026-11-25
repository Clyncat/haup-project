import { sql } from "../../lib/db.ts";
import type { Car, CreateCar, UpdateCar } from "./model.ts";

export const CarService = {
  async list() {
    const cars = await sql<Car[]>`SELECT * FROM cars ORDER BY created_at DESC`;
    return [...cars];
  },

  async get(id: string) {
    const [car] = await sql<Car[]>`SELECT * FROM cars WHERE id = ${id}`;
    return car ?? null;
  },

  async create(data: CreateCar) {
    const [car] = await sql<Car[]>`INSERT INTO cars ${sql(data)} RETURNING *`;
    return car;
  },

  async update(id: string, data: UpdateCar) {
    if (Object.keys(data).length === 0) return CarService.get(id);

    const [car] = await sql<Car[]>`
      UPDATE cars SET ${sql(data)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *`;
    return car ?? null;
  },

  async remove(id: string) {
    const result = await sql`DELETE FROM cars WHERE id = ${id}`;
    return result.count > 0;
  },
};
