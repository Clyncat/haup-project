import { sql } from "../../lib/db.ts";
import type { Car, CreateCar, UpdateCar } from "./model.ts";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, bucket } from "../../lib/s3.ts";
import { imageUrl } from "../../lib/image.ts";

export const CarService = {
  async list() {
    const cars = await sql<Car[]>`SELECT * FROM cars ORDER BY created_at DESC`;
    return withImageUrls([...cars]);
  },

  async get(id: string) {
    const [car] = await sql<Car[]>`SELECT * FROM cars WHERE id = ${id}`;
    return car ? withImageUrl(car) : null;
  },

  async create(data: CreateCar) {
    const [car] = await sql<Car[]>`INSERT INTO cars ${sql(data)} RETURNING *`;
    return withImageUrl(car);
  },

  async update(id: string, data: UpdateCar) {
    if (Object.keys(data).length === 0) return CarService.get(id);

    const [car] = await sql<Car[]>`
      UPDATE cars SET ${sql(data)}, updated_at = now()
      WHERE id = ${id}
      RETURNING *`;
    return car ? withImageUrl(car) : null;
  },

  async remove(id: string) {
    const result = await sql`DELETE FROM cars WHERE id = ${id}`;
    return result.count > 0;
  },
  async uploadImage(id: string, file: File) {
    const car = await CarService.get(id);
    if (!car) return null;

    const ext = file.type.split("/")[1];
    const key = `cars/${id}/${crypto.randomUUID()}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(await file.arrayBuffer()),
        ContentType: file.type,
      }),
    );

    const [updated] = await sql<Car[]>`
      UPDATE cars SET image_key = ${key}, updated_at = now()
      WHERE id = ${id}
      RETURNING *`;

    if (car.image_key) {
      await s3
        .send(new DeleteObjectCommand({ Bucket: bucket, Key: car.image_key }))
        .catch(() => { });
    }

    return withImageUrl(updated);
  },
};

const withImageUrl = async (car: Car) => ({
  ...car,
  image_url: await imageUrl(car.image_key),
});
const withImageUrls = (cars: Car[]) => Promise.all(cars.map(withImageUrl));
