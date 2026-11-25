import { createBrowserRouter, Navigate } from "react-router";
import { MainLayout } from "./layouts/main-layout";
import { CarsListPage } from "@/pages/cars-list";
import { CarCreatePage } from "@/pages/car-create";

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/cars" replace /> },
      { path: "cars", element: <CarsListPage /> },
      { path: "cars/new", element: <CarCreatePage /> },
      {
        path: "*",
        element: <h1 className="text-2xl font-semibold">PAGE NOT FOUND</h1>,
      },
    ],
  },
]);
