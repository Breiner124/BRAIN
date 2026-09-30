import { NextResponse } from "next/server";
import {
  esInviteeCreated,
  parseInviteeCreated,
  verifyCalendlySignature,
} from "@/lib/calendar/calendly";
import { upsertReunionCalendly } from "@/lib/data/repository";
import type { Reunion } from "@/lib/types";

export const dynamic = "force-dynamic";

// Webhook público: Calendly hace POST aquí en cada invitee.created.
// Tag el ámbito con ?ambito=consultoria|ecom en la URL suscrita.
export async function POST(req: Request) {
  const raw = await req.text();
  const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;

  // Si hay signing key configurada, exige firma válida (recomendado).
  if (signingKey) {
    const firma = req.headers.get("calendly-webhook-signature");
    if (!verifyCalendlySignature(raw, firma, signingKey)) {
      return NextResponse.json({ ok: false, error: "Firma inválida" }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }

  if (!esInviteeCreated(body as never)) {
    // Ignoramos otros eventos (p.ej. invitee.canceled) sin error.
    return NextResponse.json({ ok: true, ignored: true });
  }

  const { searchParams } = new URL(req.url);
  const ambito = (searchParams.get("ambito") as Reunion["ambito"]) ?? "consultoria";
  const reunion = parseInviteeCreated(body as never, ambito);
  if (!reunion) {
    return NextResponse.json({ ok: false, error: "Payload sin start_time" }, { status: 422 });
  }

  const guardada = upsertReunionCalendly(reunion);
  return NextResponse.json({ ok: true, data: guardada }, { status: 201 });
}
