import { Link } from "react-router";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CarCard, type Car } from "@/entities/car";
import { useObjectUrl } from "@/shared/lib/hooks/use-object-url";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Spinner } from "@/shared/ui/spinner";
import { Textarea } from "@/shared/ui/textarea";
import { createCarSchema, type CreateCarValues } from "../model/schema";
import { useCreateCar } from "../api/use-create-car";

type CreateCarFormProps = {
  onCreated?: (car: Car) => void;
};

export function CreateCarForm({ onCreated }: CreateCarFormProps) {
  const createCar = useCreateCar();
  const form = useForm<CreateCarValues>({
    resolver: zodResolver(createCarSchema),
    defaultValues: {
      license_plate: "",
      brand: "",
      model: "",
      year: "",
      remake: "",
    },
  });
  const { errors } = form.formState;

  // Live values for the preview (re-renders on every keystroke)
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

  const onSubmit = (data: CreateCarValues) => {
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
      {/* ── Form ── */}
      <Card>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <CardHeader>
            <CardTitle>Car details</CardTitle>
          </CardHeader>

          <CardContent>
            <FieldGroup>
              <Field data-invalid={!!errors.license_plate}>
                <FieldLabel htmlFor="license_plate">License plate</FieldLabel>
                <Input
                  id="license_plate"
                  placeholder="1กข-1234"
                  aria-invalid={!!errors.license_plate}
                  {...form.register("license_plate")}
                />
                <FieldError errors={[errors.license_plate]} />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.brand}>
                  <FieldLabel htmlFor="brand">Brand</FieldLabel>
                  <Input
                    id="brand"
                    placeholder="Mazda"
                    aria-invalid={!!errors.brand}
                    {...form.register("brand")}
                  />
                  <FieldError errors={[errors.brand]} />
                </Field>

                <Field data-invalid={!!errors.model}>
                  <FieldLabel htmlFor="model">Model</FieldLabel>
                  <Input
                    id="model"
                    placeholder="3 Hatchback"
                    aria-invalid={!!errors.model}
                    {...form.register("model")}
                  />
                  <FieldError errors={[errors.model]} />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field data-invalid={!!errors.year}>
                  <FieldLabel htmlFor="year">Year</FieldLabel>
                  <Input
                    id="year"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="2016"
                    aria-invalid={!!errors.year}
                    {...form.register("year")}
                  />
                  <FieldError errors={[errors.year]} />
                </Field>

                <Field data-invalid={!!errors.price_per_day}>
                  <FieldLabel htmlFor="price_per_day">
                    Price per day (THB)
                  </FieldLabel>
                  <Input
                    id="price_per_day"
                    type="number"
                    min={0}
                    step={1}
                    placeholder="1042"
                    aria-invalid={!!errors.price_per_day}
                    {...form.register("price_per_day", { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.price_per_day]} />
                </Field>
              </div>

              <Field data-invalid={!!errors.remake}>
                <FieldLabel htmlFor="remake">Notes</FieldLabel>
                <Textarea
                  id="remake"
                  placeholder="Near BTS, unlock via app…"
                  aria-invalid={!!errors.remake}
                  {...form.register("remake")}
                />
                <FieldError errors={[errors.remake]} />
              </Field>

              {/* File inputs can't be "controlled", so pass the chosen File to RHF manually */}
              <Controller
                control={form.control}
                name="image"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="image">Photo</FieldLabel>
                    <Input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        field.onChange(file); // value for the form / Zod
                        setPreviewFile(
                          file?.type.startsWith("image/") ? file : null,
                        ); // preview real images only
                      }}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      JPEG, PNG or WebP · up to 5MB · optional
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
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

      {/* ── Live preview ── */}
      <div className="space-y-2 lg:sticky lg:top-6 lg:self-start">
        <p className="text-sm font-medium text-muted-foreground">Preview</p>
        <CarCard car={preview} />
      </div>
    </div>
  );
}
