import { useMutation, useQueryClient } from "@tanstack/react-query";
import { carApi, CAR_QUERIES } from "@/entities/car";

export function useDeleteCar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => carApi.remove(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: CAR_QUERIES.all() }),
  });
}
