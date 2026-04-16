import axios, { type AxiosResponse } from "axios";
import type {
  Availability,
  AvailableSlot,
  Booking,
  EventType,
  PaginatedBookings,
  PublicEvent
} from "@/types";

type ApiEnvelope<T> = { data: T };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" }
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error.response?.data ?? { error: error.message })
);

async function unwrap<T>(request: Promise<AxiosResponse<T>>) {
  return (await request).data;
}

export type EventTypePayload = {
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  color?: string;
  bufferTime?: number;
  isActive?: boolean;
};

export const eventTypesApi = {
  list: async () => (await unwrap<ApiEnvelope<EventType[]>>(api.get("/event-types"))).data,
  get: async (id: string) => (await unwrap<ApiEnvelope<EventType>>(api.get(`/event-types/${id}`))).data,
  create: async (data: EventTypePayload) => (await unwrap<ApiEnvelope<EventType>>(api.post("/event-types", data))).data,
  update: async (id: string, data: Partial<EventTypePayload>) =>
    (await unwrap<ApiEnvelope<EventType>>(api.patch(`/event-types/${id}`, data))).data,
  delete: async (id: string) => (await unwrap<ApiEnvelope<EventType>>(api.delete(`/event-types/${id}`))).data
};

export const availabilityApi = {
  get: async () => (await unwrap<ApiEnvelope<Availability>>(api.get("/availability"))).data,
  replace: async (data: { timezone: string; slots: Array<{ dayOfWeek: number; startTime: string; endTime: string }> }) =>
    (await unwrap<ApiEnvelope<Availability>>(api.put("/availability", data))).data
};

export const bookingsApi = {
  list: async (status: "upcoming" | "past" | "cancelled" | "all", page = 1, limit = 10) =>
    unwrap<PaginatedBookings>(api.get("/bookings", { params: { status, page, limit } })),
  get: async (id: string) => (await unwrap<ApiEnvelope<Booking>>(api.get(`/bookings/${id}`))).data,
  cancel: async (id: string, reason?: string) =>
    (await unwrap<ApiEnvelope<Booking>>(api.delete(`/bookings/${id}`, { data: { reason } }))).data
};

export const publicApi = {
  event: async (username: string, slug: string) =>
    (await unwrap<ApiEnvelope<PublicEvent>>(api.get(`/public/${username}/${slug}`))).data,
  slots: async (username: string, slug: string, date: string, timezone: string) =>
    (await unwrap<ApiEnvelope<AvailableSlot[]>>(
      api.get(`/public/${username}/${slug}/slots`, { params: { date, timezone } })
    )).data,
  book: async (
    username: string,
    slug: string,
    data: { date?: string; startTime: string; guestName: string; guestEmail: string; notes?: string }
  ) => (await unwrap<ApiEnvelope<Booking>>(api.post(`/public/${username}/${slug}/book`, data))).data,
  confirmation: async (id: string) =>
    (await unwrap<ApiEnvelope<Booking>>(api.get(`/public/booking/${id}/confirm`))).data
};
