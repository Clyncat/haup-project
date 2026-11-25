import { useMutation, useQueryClient } from "@tanstack/react-query";
import { carApi, CAR_QUERIES } from "@/entities/car";
import type { CreateCarValues } from "../model/schema";

export function useCreateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image, ...body }: CreateCarValues) => {
      const car = await carApi.create(body);
      if (!image) return { car, imageFailed: false };

      try {
        return {
          car: await carApi.uploadImage(car.id, image),
          imageFailed: false,
        };
      } catch {
        return { car, imageFailed: true };
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: CAR_QUERIES.all() }),
  });
}
