// ── Integración Calendly (§14 — Fase 3) ────────────────────────────
// Webhook `invitee.created` → se inserta en `reuniones` con fuente='calendly'.
// Requiere: token Calendly (para crear la suscripción) y una signing key para
// verificar la firma de cada webhook. URL pública = tu deploy en Vercel.

import crypto from "node:crypto";
import type { Reunion } from "@/lib/types";

// ── Verificación de firma del webhook ──────────────────────────────
// Header: `Calendly-Webhook-Signature: t=<timestamp>,v1=<hmac_sha256_hex>`
// El contenido firmado es `${t}.${rawBody}`.
export function verifyCalendlySignature(
  rawBody: string,
  signatureHeader: string | null,
  signingKey: string | undefined,
  toleranciaSeg = 300
): boolean {
  if (!signingKey) return false;
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k.trim(), v?.trim() ?? ""];
    })
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;

  // Anti-replay: rechaza timestamps muy viejos.
  const edad = Math.abs(Date.now() / 1000 - Number(t));
  if (Number.isFinite(edad) && edad > toleranciaSeg) return false;

  const esperado = crypto
    .createHmac("sha256", signingKey)
    .update(`${t}.${rawBody}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(v1));
  } catch {
    return false;
  }
}

// ── Parseo del evento invitee.created ──────────────────────────────
interface CalendlyWebhookBody {
  event?: string;
  payload?: {
    name?: string;
    email?: string;
    scheduled_event?: {
      name?: string;
      start_time?: string;
      end_time?: string;
      uri?: string;
    };
    uri?: string;
  };
}

export interface ReunionDesdeCalendly {
  ambito: Reunion["ambito"];
  titulo: string;
  con_quien?: string;
  inicio: string;
  fin?: string | null;
  calendly_event_id: string | null;
}

export function esInviteeCreated(body: CalendlyWebhookBody): boolean {
  return body?.event === "invitee.created";
}

export function parseInviteeCreated(
  body: CalendlyWebhookBody,
  ambito: Reunion["ambito"] = "consultoria"
): ReunionDesdeCalendly | null {
  const p = body?.payload;
  const ev = p?.scheduled_event;
  if (!ev?.start_time) return null;
  return {
    ambito,
    titulo: ev.name ?? "Reunión Calendly",
    con_quien: p?.name ?? p?.email ?? undefined,
    inicio: ev.start_time,
    fin: ev.end_time ?? null,
    calendly_event_id: ev.uri ?? p?.uri ?? null,
  };
}

// ── Suscripción de webhook (requiere token) — helper opcional ───────
// Ejecutar UNA vez para registrar tu URL pública en Calendly.
// TODO(Bran): correr con CALENDLY_TOKEN y tu URL de Vercel.
export async function crearSuscripcionWebhook(opts: {
  token: string;
  url: string; // https://tu-app.vercel.app/api/webhooks/calendly
  organizationUri: string; // de GET https://api.calendly.com/users/me
  signingKey?: string;
}): Promise<Response> {
  return fetch("https://api.calendly.com/webhook_subscriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: opts.url,
      events: ["invitee.created", "invitee.canceled"],
      organization: opts.organizationUri,
      scope: "organization",
      signing_key: opts.signingKey,
    }),
  });
}
