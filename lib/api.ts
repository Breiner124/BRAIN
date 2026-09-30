import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(mensaje: string, status = 400) {
  return NextResponse.json({ ok: false, error: mensaje }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    return fail(e.issues.map((i) => i.message).join(" · "), 422);
  }
  if (e instanceof Error) return fail(e.message, 400);
  return fail("Error desconocido", 500);
}
