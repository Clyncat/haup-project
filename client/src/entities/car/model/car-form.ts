import { z } from "zod";
import type { DefaultValues } from "react-hook-form";
import type { Car } from "./types";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const carFormSchema = z.object({
  license_plate: z.string().trim().min(1, "License plate is required").max(20),
  brand: z.string().trim().min(1, "Brand is required").max(100),
  model: z.string().trim().min(1, "Model is required").max(100),
  year: z.string().regex(/^[0-9]{4}$/, "Year must be 4 digits"),
  price_per_day: z
    .number({ error: "Price is required" })
    .int("Whole baht only")
    .min(0, "Price can't be negative"),
  remake: z.string().trim().max(500),
  image: z
    .instanceof(File)
    .refine((f) => IMAGE_TYPES.includes(f.type), "Only JPEG, PNG or WebP")
    .refine((f) => f.size <= MAX_IMAGE_SIZE, "Image must be 5MB or smaller")
    .optional(),
});

export type CarFormValues = z.infer<typeof carFormSchema>;

export const EMPTY_CAR_FORM: DefaultValues<CarFormValues> = {
  license_plate: "",
  brand: "",
  model: "",
  year: "",
  remake: "",
};

export const toCarFormValues = (car: Car): DefaultValues<CarFormValues> => ({
  license_plate: car.license_plate,
  brand: car.brand,
  model: car.model,
  year: car.year,
  price_per_day: car.price_per_day,
  remake: car.remake,
});
