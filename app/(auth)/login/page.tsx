import Link from "next/link";
import { Brain } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = { title: "Entrar · El Cerebro" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <Brain size={40} className="mx-auto mb-3 text-central" />
        <h1 className="text-xl font-bold text-fg">El Cerebro</h1>
        <p className="mt-1 text-sm text-muted">
          Modo demo activo — un solo usuario (Bran). El login con Supabase Auth se
          activa al conectar la base de datos (ver README).
        </p>
        <Link href="/" className="mt-5 block">
          <Button className="w-full">Entrar al cerebro</Button>
        </Link>
      </Card>
    </main>
  );
}
