import { ok, handleError } from "@/lib/api";
import { construirAlertas } from "@/lib/alertas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await construirAlertas());
  } catch (e) {
    return handleError(e);
  }
}
