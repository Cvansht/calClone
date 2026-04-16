"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Clock3, LayoutDashboard, Video } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", label: "Event Types", icon: LayoutDashboard },
  { href: "/dashboard/availability", label: "Availability", icon: Clock3 },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarDays }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-zinc-200 bg-white lg:block">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center gap-3 border-b border-zinc-200 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">CalClone</p>
            <p className="text-xs text-zinc-500">admin workspace</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-3 py-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950",
                  active && "bg-zinc-950 text-white hover:bg-zinc-950 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-zinc-200 p-4">
          <Link
            href="/admin/30min"
            className="block rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:border-blue-500 hover:text-blue-700"
          >
            Open public page
          </Link>
        </div>
      </div>
    </aside>
  );
}
