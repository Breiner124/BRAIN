import { ok, handleError } from "@/lib/api";
import { eliminarIngreso } from "@/lib/data/repository";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    return ok(await eliminarIngreso(params.id));
  } catch (e) {
    return handleError(e);
  }
}
