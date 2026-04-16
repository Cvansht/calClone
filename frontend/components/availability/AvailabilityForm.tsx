"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { useAvailability } from "@/hooks/useAvailability";
import type { AvailabilitySlot } from "@/types";

const days = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" }
];

type DayState = {
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function makeTimeOptions() {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      options.push(`${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`);
    }
  }
  return options;
}

function initialDays(): Record<number, DayState> {
  return days.reduce<Record<number, DayState>>((acc, day) => {
    acc[day.value] = { enabled: false, startTime: "09:00", endTime: "17:00" };
    return acc;
  }, {});
}

export function AvailabilityForm() {
  const { data, loading, error, save } = useAvailability();
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [timezoneQuery, setTimezoneQuery] = useState("");
  const [dayState, setDayState] = useState<Record<number, DayState>>(initialDays);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const timeOptions = useMemo(makeTimeOptions, []);
  const timezones = useMemo(() => {
    if (typeof Intl.supportedValuesOf === "function") {
      return Intl.supportedValuesOf("timeZone");
    }
    return ["Asia/Kolkata", "UTC", "America/New_York", "Europe/London"];
  }, []);
  const filteredTimezones = useMemo(() => {
    const query = timezoneQuery.trim().toLowerCase();
    if (!query) {
      return timezones;
    }
    return timezones.filter((value) => value.toLowerCase().includes(query));
  }, [timezoneQuery, timezones]);

  useEffect(() => {
    if (!data) {
      return;
    }

    const next = initialDays();
    for (const slot of data.slots) {
      next[slot.dayOfWeek] = {
        enabled: true,
        startTime: slot.startTime,
        endTime: slot.endTime
      };
    }

    setTimezone(data.timezone);
    setDayState(next);
  }, [data]);

  const updateDay = (day: number, patch: Partial<DayState>) => {
    setDayState((current) => ({
      ...current,
      [day]: { ...current[day], ...patch }
    }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    const slots: AvailabilitySlot[] = days
      .filter((day) => dayState[day.value].enabled)
      .map((day) => ({
        dayOfWeek: day.value,
        startTime: dayState[day.value].startTime,
        endTime: dayState[day.value].endTime
      }));

    try {
      await save(timezone, slots);
      setNotice("Availability saved.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Could not save availability.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-blue-700">Availability</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Working hours</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Guests can only book slots inside these weekly windows.
        </p>
      </div>

      {loading && <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">Loading availability...</p>}
      {error && <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <form onSubmit={submit} className="space-y-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-soft">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Timezone</span>
          <input
            value={timezoneQuery}
            onChange={(event) => setTimezoneQuery(event.target.value)}
            className="mt-2 w-full rounded-lg border-zinc-300 text-sm md:w-96"
            placeholder="Search timezones"
          />
          <select
            value={timezone}
            onChange={(event) => setTimezone(event.target.value)}
            className="mt-2 w-full rounded-lg border-zinc-300 text-sm md:w-96"
          >
            {!filteredTimezones.includes(timezone) && (
              <option value={timezone}>{timezone}</option>
            )}
            {filteredTimezones.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>

        <div className="divide-y divide-zinc-200 rounded-lg border border-zinc-200">
          {days.map((day) => {
            const current = dayState[day.value];
            return (
              <div key={day.value} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={current.enabled}
                    onChange={(event) => updateDay(day.value, { enabled: event.target.checked })}
                    className="h-4 w-4 rounded border-zinc-300 text-blue-600"
                  />
                  <span className="text-sm font-medium text-zinc-900">{day.label}</span>
                </label>
                <select
                  value={current.startTime}
                  disabled={!current.enabled}
                  onChange={(event) => updateDay(day.value, { startTime: event.target.value })}
                  className="rounded-lg border-zinc-300 text-sm disabled:bg-zinc-100"
                >
                  {timeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
                <select
                  value={current.endTime}
                  disabled={!current.enabled}
                  onChange={(event) => updateDay(day.value, { endTime: event.target.value })}
                  className="rounded-lg border-zinc-300 text-sm disabled:bg-zinc-100"
                >
                  {timeOptions.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-5">
          <p className="text-sm text-zinc-600">{notice ?? "Changes replace the default weekly schedule."}</p>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save availability"}
          </button>
        </div>
      </form>
    </section>
  );
}
