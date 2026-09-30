import { ok, handleError } from "@/lib/api";
import { pagarDeudaTotal } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return ok(pagarDeudaTotal(params.id));
  } catch (e) {
    return handleError(e);
  }
}
