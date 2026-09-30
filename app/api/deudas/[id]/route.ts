import { ok, handleError } from "@/lib/api";
import { eliminarDeuda } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return ok(await eliminarDeuda(params.id));
  } catch (e) {
    return handleError(e);
  }
}
