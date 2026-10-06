import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { roomService } from "@/backend/service/room.service";

vi.mock("@/backend/service/room.service", () => ({
  roomService: {
    list: vi.fn(),
    listFiltered: vi.fn(),
    listByCreator: vi.fn(),
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getSession: vi.fn(),
}));

function req(url: string) {
  return new Request(`http://localhost${url}`);
}

describe("GET /api/rooms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve listar todas as salas sem filtros", async () => {
    vi.mocked(roomService.list).mockResolvedValue([{ id: "1" }] as any);
    const res = await GET(req("/api/rooms"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rooms).toHaveLength(1);
    expect(roomService.list).toHaveBeenCalled();
    expect(roomService.listFiltered).not.toHaveBeenCalled();
  });

  it("deve aplicar filtro de busca por q", async () => {
    vi.mocked(roomService.listFiltered).mockResolvedValue([] as any);
    const res = await GET(req("/api/rooms?q=daily"));
    expect(res.status).toBe(200);
    expect(roomService.listFiltered).toHaveBeenCalledWith(
      expect.objectContaining({ q: "daily" }),
    );
  });

  it("deve aplicar filtro por data", async () => {
    vi.mocked(roomService.listFiltered).mockResolvedValue([] as any);
    await GET(req("/api/rooms?date=2026-10-06"));
    expect(roomService.listFiltered).toHaveBeenCalledWith(
      expect.objectContaining({ date: "2026-10-06" }),
    );
  });

  it("deve aplicar filtros de recursos e participantes", async () => {
    vi.mocked(roomService.listFiltered).mockResolvedValue([] as any);
    await GET(req("/api/rooms?resources=Wifi,Projetor&minParticipants=3"));
    expect(roomService.listFiltered).toHaveBeenCalledWith(
      expect.objectContaining({
        resources: ["Wifi", "Projetor"],
        minParticipants: 3,
      }),
    );
  });

  it("deve retornar 500 quando o service falha", async () => {
    vi.mocked(roomService.list).mockRejectedValue(new Error("db down"));
    const res = await GET(req("/api/rooms"));
    expect(res.status).toBe(500);
  });

  it("mine=true sem sessão retorna 401", async () => {
    const { getSession } = await import("@/lib/auth/session");
    vi.mocked(getSession).mockResolvedValue(null);
    const res = await GET(req("/api/rooms?mine=true"));
    expect(res.status).toBe(401);
  });

  it("mine=true retorna somente as salas do usuário logado", async () => {
    const { getSession } = await import("@/lib/auth/session");
    vi.mocked(getSession).mockResolvedValue({
      sub: "user-1",
      email: "a@b.com",
      username: "maria",
    } as any);
    vi.mocked(roomService.listByCreator).mockResolvedValue([
      { id: "1" },
    ] as any);
    const res = await GET(req("/api/rooms?mine=true"));
    expect(res.status).toBe(200);
    expect(roomService.listByCreator).toHaveBeenCalledWith("user-1");
  });
});
