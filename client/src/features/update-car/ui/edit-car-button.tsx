import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import {
  CarFormFields,
  carFormSchema,
  toCarFormValues,
  type Car,
  type CarFormValues,
} from "@/entities/car";
import { useObjectUrl } from "@/shared/lib/hooks/use-object-url";
import { Button } from "@/shared/ui/button";
import { Spinner } from "@/shared/ui/spinner";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { useUpdateCar } from "../api/use-update-car";

// Pencil button on the card → opens a dialog with the edit form
export function EditCarButton({ car }: { car: Car }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={`Edit ${car.brand} ${car.model}`}
          />
        }
      >
        <HugeiconsIcon icon={PencilEdit02Icon} />
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit car</DialogTitle>
          <DialogDescription>
            {car.brand} {car.model} · {car.license_plate}
          </DialogDescription>
        </DialogHeader>
        {/* Mounted only while open → the form always starts from the latest car data */}
        <EditCarForm car={car} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditCarForm({ car, onDone }: { car: Car; onDone: () => void }) {
  const updateCar = useUpdateCar();
  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: toCarFormValues(car),
  });
  const [newImageUrl, setPreviewFile] = useObjectUrl();

  const onSubmit = (values: CarFormValues) => {
    updateCar.mutate(
      { id: car.id, values },
      {
        onSuccess: ({ car: saved, imageFailed }) => {
          if (imageFailed)
            toast.warning("Changes saved, but the photo failed to upload");
          else toast.success(`${saved.brand} ${saved.model} updated`);
          onDone();
        },
        onError: (error) =>
          toast.error(`Couldn't save changes: ${error.message}`),
      },
    );
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <CarFormFields
        form={form}
        onImageChange={setPreviewFile}
        imagePreviewUrl={newImageUrl ?? car.image_url} // new photo if picked, else current one
      />
      <DialogFooter>
        <DialogClose
          render={<Button variant="outline" type="button" />}
          disabled={updateCar.isPending}
        >
          Cancel
        </DialogClose>
        <Button
          type="submit"
          disabled={updateCar.isPending || !form.formState.isDirty}
        >
          {updateCar.isPending && <Spinner />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
