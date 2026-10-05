export async function hashPassword(plain: string): Promise<string> {
  if (typeof (globalThis as any).Bun !== "undefined" && (globalThis as any).Bun.password) {
    return (globalThis as any).Bun.password.hash(plain, {
      algorithm: "bcrypt",
      cost: 10,
    });
  }
  throw new Error("Bun.password não disponível. Execute o projeto com Bun runtime.");
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (typeof (globalThis as any).Bun !== "undefined" && (globalThis as any).Bun.password) {
    return (globalThis as any).Bun.password.verify(plain, hash);
  }
  throw new Error("Bun.password não disponível. Execute o projeto com Bun runtime.");
}
