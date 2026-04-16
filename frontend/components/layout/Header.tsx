import Link from "next/link";
import { MobileNav } from "./MobileNav";

const avatarUrl =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=80";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <MobileNav />
          <div>
            <p className="text-sm font-semibold text-zinc-950">Default User</p>
            <p className="text-xs text-zinc-500">Asia/Kolkata</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/event-types/new"
            className="rounded-lg bg-zinc-950 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New event
          </Link>
          <img
            src={avatarUrl}
            alt="Default User"
            className="h-9 w-9 rounded-lg object-cover"
          />
        </div>
      </div>
    </header>
  );
}
