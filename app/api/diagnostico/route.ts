import { NextResponse } from "next/server";
import { admin, usarSupabase, cerebroUserId } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// Diagnóstico seguro (no expone secretos): dice en qué modo corre la app
// y si Supabase responde. Visita /api/diagnostico en tu app.
export async function GET() {
  const env = {
    NEXT_PUBLIC_DATA_SOURCE: process.env.NEXT_PUBLIC_DATA_SOURCE ?? null,
    tiene_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    tiene_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    tiene_service_role: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    tiene_user_id: !!process.env.CEREBRO_USER_ID,
  };
  const modo = usarSupabase() ? "supabase" : "demo";

  let prueba: Record<string, unknown> = { intentado: false };
  const escritura: Record<string, unknown> = { intentado: false };

  if (env.tiene_url && env.tiene_service_role && env.tiene_user_id) {
    const uid = cerebroUserId();
    // Lectura
    try {
      const { count, error } = await admin()
        .from("nodos")
        .select("*", { count: "exact", head: true })
        .eq("user_id", uid);
      prueba = {
        intentado: true,
        conecta: !error,
        error: error?.message ?? null,
        nodos_encontrados: count ?? 0,
      };
    } catch (e) {
      prueba = {
        intentado: true,
        conecta: false,
        error: e instanceof Error ? e.message : "error desconocido",
      };
    }

    // Escritura: inserta un egreso de prueba y lo borra enseguida.
    escritura.intentado = true;
    try {
      const ins = await admin()
        .from("egresos")
        .insert({
          user_id: uid,
          categoria: "personal",
          descripcion: "__diagnostico_prueba__",
          monto: 1,
          fecha: new Date().toISOString().slice(0, 10),
          fijo: false,
        })
        .select("id")
        .single();
      if (ins.error) {
        escritura.escribe = false;
        escritura.error = ins.error.message;
      } else {
        escritura.escribe = true;
        escritura.error = null;
        await admin().from("egresos").delete().eq("id", (ins.data as { id: string }).id);
      }
    } catch (e) {
      escritura.escribe = false;
      escritura.error = e instanceof Error ? e.message : "error desconocido";
    }
  }

  return NextResponse.json({ modo, env, prueba, escritura }, { status: 200 });
}
