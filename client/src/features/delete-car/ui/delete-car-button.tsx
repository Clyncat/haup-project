import { useState } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import type { Car } from "@/entities/car";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";
import { useDeleteCar } from "../api/use-delete-car";

export function DeleteCarButton({ car }: { car: Car }) {
  const [open, setOpen] = useState(false);
  const deleteCar = useDeleteCar();

  const handleConfirm = () => {
    deleteCar.mutate(car.id, {
      onSuccess: () => {
        setOpen(false);
        toast.success(`${car.brand} ${car.model} deleted`);
      },
      onError: (error) => toast.error(`Couldn't delete car: ${error.message}`),
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" size="sm" />}>
        <HugeiconsIcon icon={Delete02Icon} />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this car?</AlertDialogTitle>
          <AlertDialogDescription>
            {car.brand} {car.model} ({car.license_plate}) will be permanently
            deleted. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteCar.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteCar.isPending}
          >
            {deleteCar.isPending && <Spinner />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
