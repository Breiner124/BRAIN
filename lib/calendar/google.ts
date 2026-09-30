// ── Google Calendar (§14 — opcional, Fase 3+) ──────────────────────
// TODO(Bran): integración opcional para una vista unificada de reuniones.
// Se deja como stub claro, sin construir aún (el blueprint lo marca opcional).
//
// Pasos cuando se quiera activar:
//  1. Crear proyecto en Google Cloud + habilitar Calendar API.
//  2. OAuth 2.0 (o service account) → guardar credenciales en env.
//  3. Sincronizar eventos → tabla `reuniones` con fuente='google'.
//
// export async function syncGoogleCalendar(): Promise<void> {
//   throw new Error("Google Calendar aún no implementado (opcional).");
// }

export const GOOGLE_CALENDAR_HABILITADO = false;
