import { NextResponse } from "next/server";
import { roomService } from "@/backend/service/room.service";
import { updateRoomSchema } from "@/backend/utility/room.validators";
import { getSession } from "@/lib/auth/session";
import { authService } from "@/backend/service/auth.service";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const room = await roomService.getById(id);
    if (!room) {
      return NextResponse.json({ message: "Sala não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ room }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const body = await req.json();
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const account = await authService.me(session.sub);
    if (!account) {
      return NextResponse.json({ message: "Conta não encontrada" }, { status: 401 });
    }
    const room = await roomService.update(id, parsed.data, account.role);
    if (!room) {
      return NextResponse.json({ message: "Sala não encontrada" }, { status: 404 });
    }
    return NextResponse.json({ room }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.startsWith("Acesso negado")
      ? 403
      : message.includes("Conflito") || message.includes("passado") || message.includes("Duração")
        ? 409
        : message.includes("não encontrada")
          ? 404
          : 400;
    return NextResponse.json({ message }, { status });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const { id } = await ctx.params;
    const account = await authService.me(session.sub);
    if (!account) {
      return NextResponse.json({ message: "Conta não encontrada" }, { status: 401 });
    }
    await roomService.remove(id, account.role, session.sub);
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.startsWith("Acesso negado")
      ? 403
      : message.includes("não encontrada")
        ? 404
        : 400;
    return NextResponse.json({ message }, { status });
  }
}
