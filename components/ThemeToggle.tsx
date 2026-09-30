"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [tema, setTema] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const guardado = (localStorage.getItem("cerebro-tema") as "dark" | "light") ?? "dark";
    setTema(guardado);
    document.documentElement.setAttribute("data-theme", guardado);
  }, []);

  function alternar() {
    const nuevo = tema === "dark" ? "light" : "dark";
    setTema(nuevo);
    document.documentElement.setAttribute("data-theme", nuevo);
    try {
      localStorage.setItem("cerebro-tema", nuevo);
    } catch {
      // ignorable
    }
  }

  return (
    <button
      onClick={alternar}
      className="rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-fg"
      aria-label={tema === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
    >
      {tema === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
