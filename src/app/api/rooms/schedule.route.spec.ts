import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { roomService } from "@/backend/service/room.service";
import { authService } from "@/backend/service/auth.service";
import { getSession } from "@/lib/auth/session";

vi.mock("@/backend/service/room.service", () => ({
  roomService: {
    create: vi.fn(),
  },
}));

vi.mock("@/backend/service/auth.service", () => ({
  authService: {
    me: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

function request(body: unknown) {
  return new Request("http://localhost/api/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Próximo dia útil no futuro, dentro do expediente. */
function nextBusinessSlot(hour = 10, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString();
}

function nextWeekend(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(14, 0, 0, 0);
  while (date.getDay() !== 6) date.setDate(date.getDate() + 1);
  return date.toISOString();
}

const validBody = {
  title: "Reunião de produto",
  roomName: "Sala A",
  description: "planejamento",
  participants: [],
  startAt: nextBusinessSlot(),
  durationMinutes: 60,
  maxDurationMinutes: 240,
  resources: [],
};

describe("POST /api/rooms - regras de agenda", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      sub: "admin-1",
      email: "admin@meethub.com",
      username: "admin",
    } as any);
    vi.mocked(authService.me).mockResolvedValue({
      id: "admin-1",
      username: "admin",
      email: "admin@meethub.com",
      role: "ADMIN",
      createdAt: new Date(),
    } as any);
  });

  it("cria reserva em dia útil dentro do expediente", async () => {
    vi.mocked(roomService.create).mockResolvedValue({ id: "r1" } as any);
    const res = await POST(request(validBody));
    expect(res.status).toBe(201);
    expect(roomService.create).toHaveBeenCalled();
  });

  it("retorna 400 para reserva no fim de semana", async () => {
    const res = await POST(request({ ...validBody, startAt: nextWeekend() }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.errors.startAt).toBeDefined();
    expect(roomService.create).not.toHaveBeenCalled();
  });

  it("retorna 400 para início antes das 08:00", async () => {
    const res = await POST(request({ ...validBody, startAt: nextBusinessSlot(7) }));
    expect(res.status).toBe(400);
    expect(roomService.create).not.toHaveBeenCalled();
  });

  it("retorna 400 quando a reserva terminaria depois das 20:00", async () => {
    const res = await POST(
      request({ ...validBody, startAt: nextBusinessSlot(19, 30), durationMinutes: 60 }),
    );
    expect(res.status).toBe(400);
    expect(roomService.create).not.toHaveBeenCalled();
  });
});