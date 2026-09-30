import { describe, it, expect } from "vitest";
import crypto from "node:crypto";
import {
  verifyCalendlySignature,
  parseInviteeCreated,
  esInviteeCreated,
} from "@/lib/calendar/calendly";

function firmar(body: string, key: string, t = Math.floor(Date.now() / 1000)) {
  const v1 = crypto.createHmac("sha256", key).update(`${t}.${body}`).digest("hex");
  return `t=${t},v1=${v1}`;
}

describe("verifyCalendlySignature", () => {
  const key = "clave-secreta";
  const body = JSON.stringify({ event: "invitee.created" });

  it("acepta una firma válida y reciente", () => {
    expect(verifyCalendlySignature(body, firmar(body, key), key)).toBe(true);
  });
  it("rechaza firma inválida", () => {
    expect(verifyCalendlySignature(body, "t=123,v1=deadbeef", key)).toBe(false);
  });
  it("rechaza timestamps viejos (replay)", () => {
    const viejo = firmar(body, key, Math.floor(Date.now() / 1000) - 10_000);
    expect(verifyCalendlySignature(body, viejo, key)).toBe(false);
  });
  it("rechaza si falta signing key o header", () => {
    expect(verifyCalendlySignature(body, firmar(body, key), undefined)).toBe(false);
    expect(verifyCalendlySignature(body, null, key)).toBe(false);
  });
});

describe("parseInviteeCreated", () => {
  const payload = {
    event: "invitee.created",
    payload: {
      name: "Cliente ACME",
      email: "acme@x.com",
      scheduled_event: {
        name: "Consultoría 45min",
        start_time: "2026-10-01T15:00:00Z",
        end_time: "2026-10-01T15:45:00Z",
        uri: "https://api.calendly.com/scheduled_events/UUID",
      },
    },
  };

  it("reconoce el evento", () => {
    expect(esInviteeCreated(payload)).toBe(true);
    expect(esInviteeCreated({ event: "invitee.canceled" })).toBe(false);
  });

  it("mapea a reunión con ámbito y calendly_event_id", () => {
    const r = parseInviteeCreated(payload, "consultoria");
    expect(r).not.toBeNull();
    expect(r!.titulo).toBe("Consultoría 45min");
    expect(r!.con_quien).toBe("Cliente ACME");
    expect(r!.inicio).toBe("2026-10-01T15:00:00Z");
    expect(r!.ambito).toBe("consultoria");
    expect(r!.calendly_event_id).toContain("scheduled_events");
  });

  it("devuelve null sin start_time", () => {
    expect(parseInviteeCreated({ event: "invitee.created", payload: {} })).toBeNull();
  });
});
