import { Suspense } from "react";
import { ConfirmationCard } from "@/components/booking/ConfirmationCard";

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">Loading confirmation...</main>}>
      <ConfirmationCard />
    </Suspense>
  );
}
