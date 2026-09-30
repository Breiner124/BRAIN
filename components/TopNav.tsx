"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Cerebro" },
  { href: "/nodo/ganancias", label: "Ganancias" },
  { href: "/nodo/metas", label: "Metas" },
  { href: "/nodo/deudas", label: "Deudas" },
  { href: "/nodo/proyecciones", label: "Proyecciones" },
  { href: "/nodo/yo", label: "Yo" },
];

export function TopNav() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-1 border-b border-border bg-bg/80 px-4 backdrop-blur">
      <Link href="/" className="mr-3 flex items-center gap-2 font-bold text-fg">
        <Brain size={20} className="text-central" />
        <span className="hidden sm:inline">El Cerebro</span>
      </Link>
      <nav className="scroll-thin flex items-center gap-1 overflow-x-auto">
        {LINKS.map((l) => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition",
                active
                  ? "bg-surface-2 text-fg"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
