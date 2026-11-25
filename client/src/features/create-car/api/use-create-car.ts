import { useMutation, useQueryClient } from "@tanstack/react-query";
import { carApi, CAR_QUERIES, type CarFormValues } from "@/entities/car";

export function useCreateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ image, ...body }: CarFormValues) => {
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
