import { ok, handleError } from "@/lib/api";
import { construirAlertas } from "@/lib/alertas";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(construirAlertas());
  } catch (e) {
    return handleError(e);
  }
}
