import { Elysia } from "elysia";
import { node } from "@elysia/node";
import { health } from "./modules/health/index.js";
import { cars } from "./modules/cars/index.ts";

const app = new Elysia({ adapter: node(), prefix: "/api" })
  .use(health)
  .use(cars)
  .get("/", () => "Hello Elysia")
  .listen(3000, ({ hostname, port }) => {
    console.log(`🦊 Elysia is running at ${hostname}:${port}`);
  });
