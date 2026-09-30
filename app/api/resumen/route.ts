import { ok, handleError } from "@/lib/api";
import { construirResumen } from "@/lib/summary";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await construirResumen());
  } catch (e) {
    return handleError(e);
  }
}
