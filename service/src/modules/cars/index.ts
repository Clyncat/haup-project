import { Elysia } from "elysia";
import { CarService } from "./service.ts";
import { carFields } from "./model.ts";

export const cars = new Elysia({ prefix: "/cars" })
  .get("/", () => CarService.list())
  .get("/:id", ({ params }) => CarService.get(params.id))
  .post("/", ({ body }) => CarService.create(body), {
    body: carFields,
  })
  .patch("/:id", ({ params, body }) => CarService.update(params.id, body), {
    body: carFields.partial(),
  })
  .delete("/:id", ({ params }) => CarService.remove(params.id));
