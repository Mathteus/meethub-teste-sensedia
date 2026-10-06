import { NextResponse } from "next/server";
import { roomService } from "@/backend/service/room.service";
import { createRoomSchema } from "@/backend/utility/room.validators";
import { getSession } from "@/lib/auth/session";
import { authService } from "@/backend/service/auth.service";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const q = searchParams.get("q");
    const resources = searchParams.get("resources");
    const minParticipantsParam = searchParams.get("minParticipants");
    const mine = searchParams.get("mine") === "true";
    const minParticipants = minParticipantsParam
      ? Number(minParticipantsParam)
      : null;

    if (mine) {
      const session = await getSession();
      if (!session) {
        return NextResponse.json(
          { message: "Não autenticado" },
          { status: 401 },
        );
      }
      const rooms = await roomService.listByCreator(session.sub);
      return NextResponse.json({ rooms }, { status: 200 });
    }

    const hasFilters =
      date || q || resources || (minParticipants !== null && !isNaN(minParticipants));

    const rooms = hasFilters
      ? await roomService.listFiltered({
          date,
          q,
          resources: resources ? resources.split(",").filter(Boolean) : [],
          minParticipants:
            minParticipants !== null && !isNaN(minParticipants)
              ? minParticipants
              : null,
        })
      : await roomService.list();

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

    const account = await authService.me(session.sub);
    if (!account) {
      return NextResponse.json(
        { message: "Conta não encontrada" },
        { status: 401 },
      );
    }

    const room = await roomService.create(
      { ...parsed.data, createdBy: session.sub },
      account.role,
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
