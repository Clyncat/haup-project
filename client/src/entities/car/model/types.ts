export type Car = {
  id: string;
  license_plate: string;
  brand: string;
  model: string;
  year: string;
  price_per_day: number;
  image_key: string | null;
  image_url: string | null;
  remake: string;
  created_at: string;
  updated_at: string;
};

export type CreateCarBody = Pick<
  Car,
  "license_plate" | "brand" | "model" | "year" | "price_per_day" | "remake"
>;
