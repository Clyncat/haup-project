import { Controller, type UseFormReturn } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import type { CarFormValues } from "../model/car-form";

type CarFormFieldsProps = {
  form: UseFormReturn<CarFormValues>;
  onImageChange?: (file: File | null) => void;
  imagePreviewUrl?: string | null;
};

export function CarFormFields({
  form,
  onImageChange,
  imagePreviewUrl,
}: CarFormFieldsProps) {
  const { errors } = form.formState;

  return (
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
          <FieldLabel htmlFor="price_per_day">Price per day (THB)</FieldLabel>
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
            {imagePreviewUrl && (
              <img
                src={imagePreviewUrl}
                alt=""
                className="aspect-[16/10] w-40 rounded-md border object-cover"
              />
            )}
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
                onImageChange?.(file?.type.startsWith("image/") ? file : null);
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
  );
}
