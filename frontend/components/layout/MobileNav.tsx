"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, LayoutDashboard, Menu, X } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Event Types", icon: LayoutDashboard },
  { href: "/dashboard/availability", label: "Availability", icon: Clock3 },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays }
];

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-200 p-2 text-zinc-700"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-zinc-950/30">
          <div className="h-full w-72 border-r border-zinc-200 bg-white p-4 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm font-semibold">CalClone</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-zinc-200 p-2"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
