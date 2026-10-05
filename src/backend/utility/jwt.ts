export interface JWTPayload {
  sub: string;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurada nas variáveis de ambiente");
  }
  return secret;
}

const DEFAULT_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7;

export async function signJWT(
  payload: Omit<JWTPayload, "iat" | "exp">,
  expiresInMs: number = DEFAULT_EXPIRY_MS,
): Promise<string> {
  const secret = getJWTSecret();
  const now = Date.now();

  if (
    typeof (globalThis as any).Bun !== "undefined" &&
    (globalThis as any).Bun.jwt
  ) {
    return (globalThis as any).Bun.jwt.sign(
      {
        ...payload,
        exp: Math.floor((now + expiresInMs) / 1000),
        iat: Math.floor(now / 1000),
      },
      secret,
    );
  }

  const tokenPayload = {
    ...payload,
    exp: Math.floor((now + expiresInMs) / 1000),
    iat: Math.floor(now / 1000),
  };
  const encoded = btoa(JSON.stringify(tokenPayload));
  const hash = await subtleHash(`${encoded}.${secret}`);
  return `${encoded}.${hash}`;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  if (!token) return null;
  const secret = getJWTSecret();

  try {
    if (
      typeof (globalThis as any).Bun !== "undefined" &&
      (globalThis as any).Bun.jwt
    ) {
      const verified = (globalThis as any).Bun.jwt.verify(token, secret);
      if (!verified) return null;
      const decoded = (globalThis as any).Bun.jwt.decode(token) as JWTPayload;
      if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
      return decoded;
    }

    const [encoded, signature] = token.split(".");
    const expectedHash = await subtleHash(`${encoded}.${secret}`);
    if (signature !== expectedHash) return null;
    const decoded = JSON.parse(atob(encoded)) as JWTPayload;
    if (decoded.exp && decoded.exp * 1000 < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

async function subtleHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(hashBuffer);
  let result = "";
  for (let i = 0; i < bytes.length; i++) {
    result += bytes[i].toString(16).padStart(2, "0");
  }
  return result;
}
