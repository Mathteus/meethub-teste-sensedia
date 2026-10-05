import { describe, it, expect, vi, beforeEach } from "vitest";
import { AuthService } from "./auth.service";
import { accountRepository } from "../repository/account.repository";
import { hashPassword, verifyPassword } from "../utility/hash";
import { signJWT } from "../utility/jwt";

vi.mock("../repository/account.repository", () => ({
  accountRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../utility/hash", () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("../utility/jwt", () => ({
  signJWT: vi.fn(),
}));

const service = new AuthService();

const createdAccount = {
  id: "uuid-1",
  username: "dorivaldo",
  email: "test@mail.com",
  passwordHash: "hashed",
  role: "USER",
  createdAt: new Date("2026-01-01"),
};

describe("AuthService.signup", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve criar uma conta e retornar token", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(accountRepository.create).mockResolvedValue(createdAccount as any);
    vi.mocked(signJWT).mockResolvedValue("jwt-token");

    const result = await service.signup({
      username: "dorivaldo",
      email: "test@mail.com",
      password: "@Test123",
      confirmPassword: "@Test123",
      role: "USER",
    });

    expect(hashPassword).toHaveBeenCalledWith("@Test123");
    expect(accountRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ passwordHash: "hashed" }),
    );
    expect(result.token).toBe("jwt-token");
    expect(result.account.email).toBe("test@mail.com");
  });

  it("deve criar conta com role USER por padrão quando não informado", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(accountRepository.create).mockResolvedValue({
      ...createdAccount,
      role: "USER",
    } as any);
    vi.mocked(signJWT).mockResolvedValue("jwt-token");

    const result = await service.signup({
      username: "dorivaldo",
      email: "test@mail.com",
      password: "@Test123",
      confirmPassword: "@Test123",
      role: "USER",
    });

    expect(accountRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "USER" }),
    );
    expect(result.account.role).toBe("USER");
    expect(signJWT).toHaveBeenCalledWith({
      sub: expect.any(String),
      email: "test@mail.com",
      username: "dorivaldo",
    });
    expect(signJWT).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve criar conta com role ADMIN quando informado", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue("hashed");
    vi.mocked(accountRepository.create).mockResolvedValue({
      ...createdAccount,
      role: "ADMIN",
    } as any);
    vi.mocked(signJWT).mockResolvedValue("jwt-token");

    const result = await service.signup({
      username: "admin",
      email: "admin@mail.com",
      password: "@Test123",
      confirmPassword: "@Test123",
      role: "ADMIN",
    });

    expect(accountRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: "ADMIN" }),
    );
    expect(result.account.role).toBe("ADMIN");
    expect(signJWT).toHaveBeenCalledWith({
      sub: createdAccount.id,
      email: createdAccount.email,
      username: createdAccount.username,
    });
    expect(signJWT).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve lançar erro quando o e-mail já está cadastrado", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(
      createdAccount as any,
    );

    await expect(
      service.signup({
        username: "dorivaldo",
        email: "test@mail.com",
        password: "@Test123",
        confirmPassword: "@Test123",
        role: "USER",
      }),
    ).rejects.toThrow("E-mail já cadastrado");
    expect(accountRepository.create).not.toHaveBeenCalled();
  });
});

describe("AuthService.signin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve retornar a conta e o token com credenciais válidas", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(
      createdAccount as any,
    );
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(signJWT).mockResolvedValue("jwt-token");

    const result = await service.signin({
      email: "test@mail.com",
      password: "@Test123",
    });

    expect(result.account.id).toBe("uuid-1");
    expect(result.token).toBe("jwt-token");
  });

  it("deve retornar role ADMIN na conta e no token quando o usuário é ADMIN", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue({
      ...createdAccount,
      role: "ADMIN",
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue(true);
    vi.mocked(signJWT).mockResolvedValue("jwt-token");

    const result = await service.signin({
      email: "admin@mail.com",
      password: "@Test123",
    });

    expect(result.account.role).toBe("ADMIN");
    expect(signJWT).toHaveBeenCalledWith({
      sub: createdAccount.id,
      email: createdAccount.email,
      username: createdAccount.username,
    });
    expect(signJWT).not.toHaveBeenCalledWith(
      expect.objectContaining({ role: expect.anything() }),
    );
  });

  it("deve lançar erro quando o usuário não existe", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(null);

    await expect(
      service.signin({ email: "x@mail.com", password: "@Test123" }),
    ).rejects.toThrow("Credenciais inválidas");
  });

  it("deve lançar erro quando a senha está incorreta", async () => {
    vi.mocked(accountRepository.findByEmail).mockResolvedValue(
      createdAccount as any,
    );
    vi.mocked(verifyPassword).mockResolvedValue(false);

    await expect(
      service.signin({ email: "test@mail.com", password: "errada" }),
    ).rejects.toThrow("Credenciais inválidas");
    expect(signJWT).not.toHaveBeenCalled();
  });
});
