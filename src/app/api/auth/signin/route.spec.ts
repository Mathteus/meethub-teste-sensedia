import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { authService } from "@/backend/service/auth.service";
import { createSession } from "@/lib/auth/session";

vi.mock("@/backend/service/auth.service", () => ({
  authService: {
    signin: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/signin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 quando os dados são inválidos", async () => {
    const res = await POST(makeRequest({ email: "invalido", password: "" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Dados inválidos");
    expect(data.errors).toBeDefined();
    expect(authService.signin).not.toHaveBeenCalled();
  });

  it("deve retornar 200 e criar sessão quando as credenciais são válidas", async () => {
    const account = {
      id: "1",
      username: "dorivaldo",
      email: "test@mail.com",
      role: "USER",
      createdAt: new Date(),
    };
    vi.mocked(authService.signin).mockResolvedValue({
      account,
      token: "token",
    });

    const res = await POST(
      makeRequest({ email: "test@mail.com", password: "@Test123" }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.account.email).toBe("test@mail.com");
    expect(createSession).toHaveBeenCalledWith({
      sub: account.id,
      email: account.email,
      username: account.username,
    });
    expect(createSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve retornar 200 com role ADMIN quando um admin faz signin", async () => {
    const account = {
      id: "2",
      username: "admin",
      email: "admin@mail.com",
      role: "ADMIN",
      createdAt: new Date(),
    };
    vi.mocked(authService.signin).mockResolvedValue({
      account,
      token: "token",
    });

    const res = await POST(
      makeRequest({ email: "admin@mail.com", password: "@Test123" }),
    );

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.account.role).toBe("ADMIN");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: account.id, email: account.email }),
    );
    expect(createSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve retornar 401 quando as credenciais são inválidas", async () => {
    vi.mocked(authService.signin).mockRejectedValue(
      new Error("Credenciais inválidas"),
    );

    const res = await POST(
      makeRequest({ email: "test@mail.com", password: "errada" }),
    );

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.message).toBe("Credenciais inválidas");
    expect(createSession).not.toHaveBeenCalled();
  });
});
