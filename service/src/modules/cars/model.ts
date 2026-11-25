import { z } from "zod";

export const carFields = z.object({
  license_plate: z.string().min(1).max(20),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  year: z.string().regex(/^[0-9]{4}$/, "year must be 4 digits"),
  price_per_day: z.number().int().min(0),
  image_key: z.string().max(500).nullable().optional(),
  remake: z.string(),
});

export type CreateCar = z.infer<typeof carFields>;
export type UpdateCar = Partial<CreateCar>;

export type Car = CreateCar & {
  id: string;
  image_key: string | null;
  created_at: Date;
  updated_at: Date;
};
