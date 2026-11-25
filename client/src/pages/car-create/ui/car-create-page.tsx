import { useNavigate } from "react-router";
import { CreateCarForm } from "@/features/create-car";

export function CarCreatePage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Add Car</h1>
      <CreateCarForm onCreated={() => navigate("/cars")} />
    </div>
  );
}
