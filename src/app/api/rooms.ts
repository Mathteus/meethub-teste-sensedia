import { NextResponse } from "next/server";

export async function GET() {
  const users = [
    { id: 1, name: "Adriele" },
    { id: 2, name: "Lucas" },
  ];

  return NextResponse.json(users, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Exemplo de validação simples
    if (!body.name) {
      return NextResponse.json(
        { error: 'O campo "name" é obrigatório.' },
        { status: 400 },
      );
    }

    const newUser = {
      id: Date.now(),
      name: body.name,
    };

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao processar a requisição." },
      { status: 500 },
    );
  }
}
