import { TopNav } from "@/components/TopNav";
import { NODE_COLORS } from "@/lib/utils";

interface Props {
  tipo: string;
  titulo: string;
  descripcion?: string;
  children: React.ReactNode;
}

export function NodeShell({ tipo, titulo, descripcion, children }: Props) {
  const color = NODE_COLORS[tipo] ?? "var(--c-central)";
  return (
    <main className="min-h-dvh">
      <TopNav />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-6 flex items-center gap-3">
          <span
            className="h-10 w-1.5 rounded-full"
            style={{ background: color, boxShadow: `0 0 16px ${color}` }}
          />
          <div>
            <h1 className="text-2xl font-bold text-fg">{titulo}</h1>
            {descripcion && <p className="text-sm text-muted">{descripcion}</p>}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
