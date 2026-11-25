import { queryOptions } from "@tanstack/react-query";
import { http } from "@/shared/api/http";
import type { Car, CreateCarBody } from "../model/types";

export const carApi = {
  list: () => http<Car[]>("/cars"),
  get: (id: string) => http<Car | null>(`/cars/${id}`),
  create: (body: CreateCarBody) =>
    http<Car>("/cars", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  update: (id: string, body: Partial<CreateCarBody>) =>
    http<Car>(`/cars/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  uploadImage: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return http<Car>(`/cars/${id}/image`, { method: "POST", body: form });
  },
  remove: (id: string) => http<boolean>(`/cars/${id}`, { method: "DELETE" }),
};

export const CAR_QUERIES = {
  all: () => ["cars"] as const,
  lists: () => [...CAR_QUERIES.all(), "list"] as const,
  list: () =>
    queryOptions({
      queryKey: CAR_QUERIES.lists(),
      queryFn: carApi.list,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...CAR_QUERIES.all(), "detail", id],
      queryFn: () => carApi.get(id),
    }),
};
