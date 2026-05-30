"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Car, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

interface NavbarProps {
  user?: { name: string; role: string } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const adminLinks = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/users", label: "User Management" },
    { href: "/admin/rides", label: "Ride Management" },
    { href: "/admin/reports", label: "Reports" },
  ];

  const riderLinks = [
    { href: "/rider", label: "Home" },
    { href: "/rider/book", label: "Book Ride" },
    { href: "/rider/history", label: "History" },
    { href: "/rider/profile", label: "Profile" },
  ];

  const driverLinks = [
    { href: "/driver", label: "Dashboard" },
    { href: "/driver/requests", label: "Requests" },
    { href: "/driver/earnings", label: "Earnings" },
    { href: "/driver/profile", label: "Profile" },
  ];

  const homeHref =
    user?.role === "ADMIN" ? "/admin" : user?.role === "DRIVER" ? "/driver" : "/rider";

  const links =
    user?.role === "ADMIN"
      ? adminLinks
      : user?.role === "DRIVER"
        ? driverLinks
        : riderLinks;

  function isActive(href: string) {
    if (href === "/rider" || href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href={user ? homeHref : "/"} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500">
            <Car className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Move<span className="text-sky-400">e</span>
          </span>
        </Link>

        {user && (
          <div className="hidden items-center gap-6 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition ${
                  isActive(link.href)
                    ? "text-sky-400"
                    : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-400 sm:inline">
                <User className="mr-1 inline h-4 w-4" />
                {user.name}
                {user.role === "ADMIN" && (
                  <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                    Admin
                  </span>
                )}
              </span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Log in</Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
