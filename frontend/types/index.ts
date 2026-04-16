export type EventType = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  color: string;
  isActive: boolean;
  bufferTime: number;
  createdAt: string;
  updatedAt: string;
  _count?: { bookings: number };
};

export type AvailabilitySlot = {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type Availability = {
  id: string;
  name: string;
  timezone: string;
  isDefault: boolean;
  slots: AvailabilitySlot[];
};

export type BookingStatus = "ACCEPTED" | "CANCELLED" | "RESCHEDULED";

export type Booking = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  guestName: string;
  guestEmail: string;
  guestNotes?: string | null;
  cancelReason?: string | null;
  meetingUrl?: string | null;
  eventType: EventType;
  user?: {
    name: string;
    username: string;
    email: string;
    timezone: string;
  };
};

export type PublicEvent = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  color: string;
  bufferTime: number;
  host: {
    name: string;
    username: string;
    email: string;
    bio?: string | null;
    timezone: string;
  };
  availability: {
    timezone: string;
    availableDays: number[];
  };
};

export type AvailableSlot = {
  startTime: string;
  endTime: string;
};

export type PaginatedBookings = {
  data: Booking[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
