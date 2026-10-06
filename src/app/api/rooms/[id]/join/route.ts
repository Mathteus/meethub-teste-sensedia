import { NextResponse } from "next/server";
import { roomService } from "@/backend/service/room.service";
import { getSession } from "@/lib/auth/session";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const room = await roomService.join(id, session.username);
    if (!room) {
      return NextResponse.json(
        { message: "Sala não encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json({ room }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.includes("não encontrada") ? 404 : 400;
    return NextResponse.json({ message }, { status });
  }
}
