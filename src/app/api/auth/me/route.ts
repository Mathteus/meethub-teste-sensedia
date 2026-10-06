import { NextResponse } from "next/server";
import { authService } from "@/backend/service/auth.service";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
  }
  const account = await authService.me(session.sub);
  if (!account) {
    return NextResponse.json({ message: "Conta não encontrada" }, { status: 401 });
  }
  return NextResponse.json({ account }, { status: 200 });
}
