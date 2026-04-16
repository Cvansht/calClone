import { PublicBookingFlow } from "@/components/booking/PublicBookingFlow";

export default function PublicBookingPage({ params }: { params: { username: string; slug: string } }) {
  return <PublicBookingFlow username={params.username} slug={params.slug} />;
}
