// ── Cliente Supabase (browser) ─────────────────────────────────────
// Se usa cuando NEXT_PUBLIC_DATA_SOURCE=supabase y las env vars existen.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase no configurado. Define NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url, key);
}

export function supabaseHabilitado(): boolean {
  return (
    process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" &&
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
