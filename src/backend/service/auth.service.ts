import { Account, Role } from "../entity/account.entity";
import { accountRepository } from "../repository/account.repository";
import { hashPassword, verifyPassword } from "../utility/hash";
import { signJWT, type JWTPayload } from "../utility/jwt";
import type { SigninInput, SignupInput } from "../utility/auth.validators";

export interface AuthResult {
  account: {
    id: string;
    username: string;
    email: string;
    role: Role;
    createdAt: Date;
  };
  token: string;
}

export class AuthService {
  async signup(input: SignupInput): Promise<AuthResult> {
    const exists = await accountRepository.findByEmail(input.email);
    if (exists) {
      throw new Error("E-mail já cadastrado");
    }

    const account = new Account({
      username: input.username,
      email: input.email,
      passwordHash: input.password,
      role: (input.role as Role) ?? Role.USER,
    });

    const hashed = await hashPassword(account.passwordHash.data);

    const created = await accountRepository.create({
      id: account.id,
      username: account.username,
      email: account.email,
      passwordHash: hashed,
      role: account.role,
      createdAt: account.createdAt,
    });

    const token = await signJWT({
      sub: created.id,
      email: created.email,
      username: created.username,
    });

    return {
      account: {
        id: created.id,
        username: created.username,
        email: created.email,
        role: created.role as Role,
        createdAt: created.createdAt,
      },
      token,
    };
  }

  async signin(input: SigninInput): Promise<AuthResult> {
    const found = await accountRepository.findByEmail(input.email);
    if (!found) {
      throw new Error("Credenciais inválidas");
    }

    const valid = await verifyPassword(input.password, found.passwordHash);
    if (!valid) {
      throw new Error("Credenciais inválidas");
    }

    const token = await signJWT({
      sub: found.id,
      email: found.email,
      username: found.username,
    });

    return {
      account: {
        id: found.id,
        username: found.username,
        email: found.email,
        role: found.role as Role,
        createdAt: found.createdAt,
      },
      token,
    };
  }

  async me(accountId: string): Promise<AuthResult["account"] | null> {
    const found = await accountRepository.findById(accountId);
    if (!found) return null;
    return {
      id: found.id,
      username: found.username,
      email: found.email,
      role: found.role as Role,
      createdAt: found.createdAt,
    };
  }
}

export const authService = new AuthService();
