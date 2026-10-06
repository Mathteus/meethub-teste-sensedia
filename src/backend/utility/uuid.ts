/**
 * Gera um UUID v7 (ordenável por tempo) sem depender do runtime Bun,
 * para que o bundle server-side funcione em Node e Bun.
 */
export function randomUUIDv7(): string {
  const bun = (globalThis as { Bun?: { randomUUIDv7?: () => string } }).Bun;
  if (bun?.randomUUIDv7) {
    return bun.randomUUIDv7();
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // 48 bits de timestamp (ms)
  const timestamp = Date.now();
  bytes[0] = (timestamp / 2 ** 40) & 0xff;
  bytes[1] = (timestamp / 2 ** 32) & 0xff;
  bytes[2] = (timestamp / 2 ** 24) & 0xff;
  bytes[3] = (timestamp / 2 ** 16) & 0xff;
  bytes[4] = (timestamp / 2 ** 8) & 0xff;
  bytes[5] = timestamp & 0xff;

  // versão 7 (0111) + variante (10)
  bytes[6] = 0x70 | (bytes[6] & 0x0f);
  bytes[8] = 0x80 | (bytes[8] & 0x3f);

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}