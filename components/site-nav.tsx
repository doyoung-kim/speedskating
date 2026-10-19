"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Medal, Search, Trophy, Upload } from "lucide-react";
import { useEffect, useState } from "react";

import { ModeToggle } from "@/components/mode-toggle";
import { readPublished } from "@/lib/records/published";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "검색", icon: Search, match: (path: string) => path === "/" || path.startsWith("/search") || path.startsWith("/athletes") },
  { href: "/meets", label: "대회", icon: Medal, match: (path: string) => path.startsWith("/meets") },
  { href: "/rankings", label: "랭킹", icon: Trophy, match: (path: string) => path.startsWith("/rankings") },
  { href: "/upload", label: "업로드", icon: Upload, match: (path: string) => path.startsWith("/upload") },
];

export function SiteNav() {
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    readPublished();
    setReady(true);
  }, []);

  const currentPath = ready ? pathname : "";

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4">
          <Link href="/" className="font-heading text-xl font-semibold tracking-tight">
            Speedskate
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3.5 py-2 text-base text-muted-foreground hover:bg-muted hover:text-foreground",
                  link.match(currentPath) && "bg-muted text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background md:hidden">
        <ul className="grid grid-cols-4">
          {links.map((link) => {
            const Icon = link.icon;
            const active = link.match(currentPath);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground",
                    active && "text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
