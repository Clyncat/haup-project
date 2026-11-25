import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert02Icon, Car01Icon } from "@hugeicons/core-free-icons";
import { CAR_QUERIES, CarCard } from "@/entities/car";
import { DeleteCarButton } from "@/features/delete-car";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

export function CarsListPage() {
  const {
    data: cars,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery(CAR_QUERIES.list());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">All Cars</h1>

      {isPending ? (
        // Loading: placeholder cards with the same layout
        <div className={GRID}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Alert02Icon} />
            </EmptyMedia>
            <EmptyTitle>Couldn't load cars</EmptyTitle>
            <EmptyDescription>{error.message}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : cars.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HugeiconsIcon icon={Car01Icon} />
            </EmptyMedia>
            <EmptyTitle>No cars yet</EmptyTitle>
            <EmptyDescription>
              Add your first car to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button render={<Link to="/cars/new" />} nativeButton={false}>
              Add car
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className={GRID}>
          {cars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              actions={<DeleteCarButton car={car} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
