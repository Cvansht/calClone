import { EventTypeForm } from "@/components/event-types/EventTypeForm";

export default function EditEventTypePage({ params }: { params: { id: string } }) {
  return <EventTypeForm mode="edit" eventTypeId={params.id} />;
}
