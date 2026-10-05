import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { authService } from "@/backend/service/auth.service";
import { createSession } from "@/lib/auth/session";

vi.mock("@/backend/service/auth.service", () => ({
  authService: {
    signup: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
}));

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  username: "dorivaldo",
  email: "test@mail.com",
  password: "@Test123",
  confirmPassword: "@Test123",
};

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve retornar 400 quando as senhas não conferem", async () => {
    const res = await POST(
      makeRequest({ ...validBody, confirmPassword: "@Outra123" }),
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.message).toBe("Dados inválidos");
    expect(data.errors.confirmPassword).toBeDefined();
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it("deve retornar 400 quando a senha é fraca", async () => {
    const res = await POST(
      makeRequest({ ...validBody, password: "fraca", confirmPassword: "fraca" }),
    );
    expect(res.status).toBe(400);
    expect(authService.signup).not.toHaveBeenCalled();
  });

  it("deve retornar 201 e criar sessão quando o cadastro é válido", async () => {
    const account = {
      id: "1",
      username: "dorivaldo",
      email: "test@mail.com",
      role: "USER",
      createdAt: new Date(),
    };
    vi.mocked(authService.signup).mockResolvedValue({ account, token: "token" });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(201);
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

  it("deve retornar 201 com role ADMIN quando um admin se cadastra", async () => {
    const account = {
      id: "2",
      username: "admin",
      email: "admin@mail.com",
      role: "ADMIN",
      createdAt: new Date(),
    };
    vi.mocked(authService.signup).mockResolvedValue({ account, token: "token" });

    const res = await POST(
      makeRequest({ ...validBody, username: "admin", email: "admin@mail.com", role: "ADMIN" }),
    );

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.account.role).toBe("ADMIN");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: account.id, email: account.email }),
    );
    expect(createSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve retornar 201 com role USER no cadastro padrão", async () => {
    const account = {
      id: "1",
      username: "dorivaldo",
      email: "test@mail.com",
      role: "USER",
      createdAt: new Date(),
    };
    vi.mocked(authService.signup).mockResolvedValue({ account, token: "token" });

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.account.role).toBe("USER");
    expect(createSession).toHaveBeenCalledWith(
      expect.objectContaining({ sub: account.id, email: account.email }),
    );
    expect(createSession).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve retornar 409 quando o e-mail já está cadastrado", async () => {
    vi.mocked(authService.signup).mockRejectedValue(
      new Error("E-mail já cadastrado"),
    );

    const res = await POST(makeRequest(validBody));

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.message).toBe("E-mail já cadastrado");
    expect(createSession).not.toHaveBeenCalled();
  });
});
