"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Settings, Share2, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  {
    href: "/recipes",
    label: "Recipes",
    icon: BookOpen,
  },
  {
    href: "/shared-with-me",
    label: "Shared with me",
    icon: Users,
  },
  {
    href: "/my-shares",
    label: "My shares",
    icon: Share2,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
              active
                ? "bg-yellow-100/80 text-yellow-900 ring-1 ring-yellow-200"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
