import { NextResponse } from "next/server";
import { roomService } from "@/backend/service/room.service";
import { createRoomSchema } from "@/backend/utility/room.validators";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const rooms = await roomService.list();
    return NextResponse.json({ rooms }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "Não autenticado" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const room = await roomService.create(
      { ...parsed.data, createdBy: session.sub },
      session.role,
    );

    return NextResponse.json({ room }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    const status = message.startsWith("Acesso negado")
      ? 403
      : message.includes("Conflito") || message.includes("passado") || message.includes("Duração")
        ? 409
        : 400;
    return NextResponse.json({ message }, { status });
  }
}
