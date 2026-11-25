import { Link } from "react-router";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  CarCard,
  CarFormFields,
  carFormSchema,
  EMPTY_CAR_FORM,
  type Car,
  type CarFormValues,
} from "@/entities/car";
import { useObjectUrl } from "@/shared/lib/hooks/use-object-url";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";
import { useCreateCar } from "../api/use-create-car";

type CreateCarFormProps = {
  onCreated?: (car: Car) => void;
};

export function CreateCarForm({ onCreated }: CreateCarFormProps) {
  const createCar = useCreateCar();
  const form = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: EMPTY_CAR_FORM,
  });

  // Live values for the preview card
  const values = useWatch({ control: form.control });
  const [imageUrl, setPreviewFile] = useObjectUrl();

  const preview: Car = {
    id: "preview",
    license_plate: values.license_plate || "ABC-1234",
    brand: values.brand || "Brand",
    model: values.model || "Model",
    year: values.year || "Year",
    price_per_day: Number.isFinite(values.price_per_day)
      ? values.price_per_day!
      : 0,
    remake: values.remake ?? "",
    image_key: null,
    image_url: imageUrl,
    created_at: "",
    updated_at: "",
  };

  const onSubmit = (data: CarFormValues) => {
    createCar.mutate(data, {
      onSuccess: ({ car, imageFailed }) => {
        if (imageFailed)
          toast.warning("Car saved, but the photo failed to upload");
        else toast.success(`${car.brand} ${car.model} added`);
        onCreated?.(car);
      },
      onError: (error) => toast.error(`Couldn't save car: ${error.message}`),
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardHeader>
            <CardTitle>Car details</CardTitle>
          </CardHeader>
          <CardContent>
            <CarFormFields form={form} onImageChange={setPreviewFile} />
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button
              variant="outline"
              render={<Link to="/cars" />}
              nativeButton={false}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createCar.isPending}>
              {createCar.isPending && <Spinner />}
              Save car
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-2 lg:sticky lg:top-6 lg:self-start">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <CarCard car={preview} />
      </div>
    </div>
  );
}
