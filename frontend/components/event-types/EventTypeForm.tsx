"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { eventTypesApi, type EventTypePayload } from "@/lib/api";
import { slugify } from "@/lib/slugify";

const durationPresets = [15, 30, 45, 60];
const colors = ["#0069FF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#111827", "#EC4899"];

const eventTypeFormSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters.").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must be at least 2 characters.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().trim().max(500, "Keep the description under 500 characters.").optional(),
  duration: z.coerce.number().int().min(5, "Minimum duration is 5 minutes.").max(480, "Maximum duration is 480 minutes."),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Choose a valid hex color."),
  bufferTime: z.coerce.number().int().min(0, "Buffer cannot be negative.").max(120, "Maximum buffer is 120 minutes.")
});

type EventTypeFormValues = z.infer<typeof eventTypeFormSchema>;

const defaultValues: EventTypeFormValues = {
  title: "",
  slug: "",
  description: "",
  duration: 30,
  color: "#0069FF",
  bufferTime: 0
};

function errorMessage(error: unknown) {
  if (typeof error === "object" && error && "error" in error) {
    return String((error as { error: string }).error);
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function EventTypeForm({ mode, eventTypeId }: { mode: "create" | "edit"; eventTypeId?: string }) {
  const router = useRouter();
  const [origin, setOrigin] = useState("http://localhost:3000");
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeFormSchema),
    mode: "onChange",
    defaultValues
  });

  const titleField = register("title");
  const slugField = register("slug");
  const duration = watch("duration");
  const slug = watch("slug");
  const color = watch("color");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (mode !== "edit" || !eventTypeId) {
      return;
    }

    let active = true;
    setLoading(true);
    eventTypesApi
      .get(eventTypeId)
      .then((eventType) => {
        if (!active) return;
        reset({
          title: eventType.title,
          slug: eventType.slug,
          description: eventType.description ?? "",
          duration: eventType.duration,
          color: eventType.color,
          bufferTime: eventType.bufferTime
        });
        setSlugTouched(true);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));

    return () => {
      active = false;
    };
  }, [eventTypeId, mode, reset]);

  const submit = async (values: EventTypeFormValues) => {
    setError(null);

    const payload: EventTypePayload = {
      ...values,
      description: values.description || null,
      slug: values.slug || slugify(values.title)
    };

    try {
      if (mode === "edit" && eventTypeId) {
        await eventTypesApi.update(eventTypeId, payload);
      } else {
        await eventTypesApi.create(payload);
      }

      router.push("/dashboard/event-types");
      router.refresh();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  if (loading) {
    return <p className="rounded-lg border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Loading event type...</p>;
  }

  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/event-types" className="text-sm font-medium text-blue-700 hover:text-blue-800">
          Back to event types
        </Link>
        <h1 className="mt-3 text-2xl font-semibold text-zinc-950">
          {mode === "edit" ? "Edit event type" : "New event type"}
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Set the title, booking URL, duration, and buffer used by the public booking page.
        </p>
      </div>

      <form onSubmit={handleSubmit(submit)} className="space-y-5 rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
        {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Title</span>
          <input
            {...titleField}
            onChange={(event) => {
              titleField.onChange(event);
              if (!slugTouched) {
                setValue("slug", slugify(event.target.value), { shouldDirty: true, shouldValidate: true });
              }
            }}
            className="mt-2 w-full rounded-lg border-zinc-300 text-sm"
            placeholder="30 Minute Meeting"
          />
          {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Booking URL</span>
          <div className="mt-2 flex rounded-lg border border-zinc-300 focus-within:border-blue-500">
            <span className="flex items-center border-r border-zinc-300 px-3 text-sm text-zinc-500">/admin/</span>
            <input
              {...slugField}
              onChange={(event) => {
                setSlugTouched(true);
                setValue("slug", slugify(event.target.value), { shouldDirty: true, shouldValidate: true });
              }}
              className="w-full rounded-lg border-0 text-sm focus:ring-0"
              placeholder="30min"
            />
          </div>
          {errors.slug && <p className="mt-1 text-xs text-red-600">{errors.slug.message}</p>}
          <p className="mt-2 break-all text-xs text-zinc-500">{origin}/admin/{slug || "your-slug"}</p>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Description</span>
          <textarea
            {...register("description")}
            className="mt-2 min-h-28 w-full rounded-lg border-zinc-300 text-sm"
            placeholder="A focused meeting for planning, reviews, and decisions."
          />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>}
        </label>

        <div>
          <span className="text-sm font-medium text-zinc-800">Duration</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {durationPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setValue("duration", preset, { shouldDirty: true, shouldValidate: true })}
                className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                  Number(duration) === preset
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-zinc-200 text-zinc-700 hover:border-zinc-400"
                }`}
              >
                {preset} min
              </button>
            ))}
            <input
              type="number"
              min={5}
              max={480}
              {...register("duration")}
              className="w-28 rounded-lg border-zinc-300 text-sm"
              aria-label="Custom duration"
            />
          </div>
          {errors.duration && <p className="mt-1 text-xs text-red-600">{errors.duration.message}</p>}
        </div>

        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Buffer time</span>
          <input
            type="number"
            min={0}
            max={120}
            {...register("bufferTime")}
            className="mt-2 w-32 rounded-lg border-zinc-300 text-sm"
          />
          {errors.bufferTime && <p className="mt-1 text-xs text-red-600">{errors.bufferTime.message}</p>}
        </label>

        <div>
          <span className="text-sm font-medium text-zinc-800">Color</span>
          <input type="hidden" {...register("color")} />
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((swatch) => (
              <button
                key={swatch}
                type="button"
                aria-label={`Use ${swatch}`}
                onClick={() => setValue("color", swatch, { shouldDirty: true, shouldValidate: true })}
                className={`h-9 w-9 rounded-lg border-2 ${color === swatch ? "border-zinc-950" : "border-transparent"}`}
                style={{ backgroundColor: swatch }}
              />
            ))}
          </div>
          {errors.color && <p className="mt-1 text-xs text-red-600">{errors.color.message}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-200 pt-5">
          <Link href="/dashboard/event-types" className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save event type"}
          </button>
        </div>
      </form>
    </section>
  );
}
