import { useMutation, useQueryClient } from "@tanstack/react-query";
import { carApi, CAR_QUERIES, type CarFormValues } from "@/entities/car";

export function useUpdateCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: CarFormValues;
    }) => {
      const { image, ...body } = values;
      const car = await carApi.update(id, body);
      if (!image) return { car, imageFailed: false };

      // Only upload when the user picked a new photo
      try {
        return { car: await carApi.uploadImage(id, image), imageFailed: false };
      } catch {
        return { car, imageFailed: true };
      }
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: CAR_QUERIES.all() }),
  });
}
