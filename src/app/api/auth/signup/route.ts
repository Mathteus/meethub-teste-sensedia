import { NextResponse } from "next/server";
import { authService } from "@/backend/service/auth.service";
import { signupSchema } from "@/backend/utility/auth.validators";
import { createSession } from "@/lib/auth/session";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Dados inválidos",
          errors: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const result = await authService.signup(parsed.data);
    await createSession({
      sub: result.account.id,
      email: result.account.email,
      username: result.account.username,
    });

    return NextResponse.json({ account: result.account }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ message }, { status: 409 });
  }
}
