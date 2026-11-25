import { Card, CardFooter, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function CarCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden pt-0">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <CardHeader className="space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardFooter className="mt-auto justify-between">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-8 w-20" />
      </CardFooter>
    </Card>
  );
}
