import { useState, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Car01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import type { Car } from "../model/types";

const thb = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  currencyDisplay: "narrowSymbol",
  maximumFractionDigits: 0,
});

type CarCardProps = {
  car: Car;
  actions?: ReactNode;
};

export function CarCard({ car, actions }: CarCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const title = `${car.brand} ${car.model} (${car.year})`;
  const notes = car.remake && car.remake !== "-" ? car.remake : null;

  return (
    <Card className="group h-full overflow-hidden pt-0 transition-shadow duration-300 hover:shadow-lg">
      <div
        className={cn(
          "relative aspect-[16/10] overflow-hidden bg-muted",
          car.image_url && !imageLoaded && "animate-pulse",
        )}
      >
        {car.image_url ? (
          <img
            src={car.image_url}
            alt={title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "absolute inset-0 size-full object-cover",
              "transition-[opacity,transform] duration-500 ease-out",
              "group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
              imageLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
            <HugeiconsIcon icon={Car01Icon} className="size-12" />
          </div>
        )}
        <Badge variant="secondary" className="absolute top-3 left-3 shadow-sm">
          {car.license_plate}
        </Badge>
      </div>

      <CardHeader>
        <CardTitle className="line-clamp-1 text-lg" title={title}>
          {title}
        </CardTitle>
        <CardDescription className="line-clamp-2 min-h-10">
          {notes}
        </CardDescription>
      </CardHeader>

      <CardFooter className="mt-auto items-end justify-between">
        <div>
          <span className="text-xl font-semibold text-primary">
            {thb.format(car.price_per_day)}
          </span>
          <span className="text-sm text-muted-foreground">/day</span>
        </div>
        {actions}
      </CardFooter>
    </Card>
  );
}
