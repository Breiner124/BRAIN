// ── Cliente Supabase de servidor (service role) ────────────────────
// Se usa SOLO en el servidor (route handlers y server components). Nunca
// llega al navegador. Opera como el usuario único (CEREBRO_USER_ID).
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cache: SupabaseClient | null = null;

/** true si Supabase está configurado como fuente de datos. */
export function usarSupabase(): boolean {
  return (
    process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
    !!process.env.CEREBRO_USER_ID
  );
}

/** UUID del usuario único (Bran) — de Authentication → Users. */
export function cerebroUserId(): string {
  const id = process.env.CEREBRO_USER_ID;
  if (!id) throw new Error("Falta CEREBRO_USER_ID en las variables de entorno.");
  return id;
}

export function admin(): SupabaseClient {
  if (cache) return cache;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase no configurado: define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  cache = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // CRÍTICO: evita que Next.js cachee las lecturas de Supabase.
      // Sin esto, los datos recién guardados no se ven hasta que expira
      // el Data Cache (minutos/horas). Con no-store, cada lectura es fresca.
      fetch: (input: RequestInfo | URL, init?: RequestInit) =>
        fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cache;
}
