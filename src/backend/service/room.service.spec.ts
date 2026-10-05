import { describe, it, expect, vi, beforeEach } from "vitest";
import { RoomService } from "./room.service";
import { roomRepository } from "../repository/room.repository";

vi.mock("../repository/room.repository", () => ({
  roomRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    findByRoomNameAndOverlap: vi.fn(),
    findFiltered: vi.fn(),
    findByCreatedBy: vi.fn(),
  },
}));

const service = new RoomService();

const roomRow = {
  id: "room-1",
  title: "Daily",
  roomName: "Sala Alfa",
  description: "Reunião diária",
  participants: ["maria", "joao"],
  startAt: new Date(Date.now() + 60 * 60 * 1000),
  durationMinutes: 30,
  resources: ["Wifi"],
  createdBy: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createInput = {
  title: "Daily",
  roomName: "Sala Alfa",
  description: "Reunião diária",
  participants: ["maria", "joao"],
  startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  durationMinutes: 30,
  resources: ["Wifi"],
};

describe("RoomService.list", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve listar salas serializadas", async () => {
    vi.mocked(roomRepository.findAll).mockResolvedValue([roomRow] as any);
    const rooms = await service.list();
    expect(rooms).toHaveLength(1);
    expect(rooms[0].title).toBe("Daily");
    expect(rooms[0].endAt).toBeInstanceOf(Date);
  });
});

describe("RoomService.listFiltered", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve repassar os filtros para o repositório", async () => {
    vi.mocked(roomRepository.findFiltered).mockResolvedValue([roomRow] as any);
    const filters = {
      date: "2026-10-06",
      q: "daily",
      resources: ["Wifi"],
      minParticipants: 2,
    };
    const rooms = await service.listFiltered(filters);
    expect(roomRepository.findFiltered).toHaveBeenCalledWith(filters);
    expect(rooms).toHaveLength(1);
  });
});

describe("RoomService.listByCreator", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve listar somente as salas do criador", async () => {
    vi.mocked(roomRepository.findByCreatedBy).mockResolvedValue([
      roomRow,
    ] as any);
    const rooms = await service.listByCreator("user-1");
    expect(roomRepository.findByCreatedBy).toHaveBeenCalledWith("user-1");
    expect(rooms).toHaveLength(1);
  });
});

describe("RoomService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve criar uma sala como admin sem conflitos", async () => {
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([]);
    vi.mocked(roomRepository.create).mockResolvedValue(roomRow as any);

    const room = await service.create(createInput as any, "ADMIN");
    expect(room.title).toBe("Daily");
    expect(roomRepository.create).toHaveBeenCalled();
  });

  it("deve negar acesso para usuário comum", async () => {
    await expect(service.create(createInput as any, "USER")).rejects.toThrow(
      "Acesso negado",
    );
    expect(roomRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar reserva no passado", async () => {
    const past = {
      ...createInput,
      startAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    };
    await expect(service.create(past as any, "ADMIN")).rejects.toThrow(
      "passado",
    );
  });

  it("deve rejeitar duração inválida", async () => {
    await expect(
      service.create({ ...createInput, durationMinutes: 5 } as any, "ADMIN"),
    ).rejects.toThrow("Duração");
  });

  it("deve rejeitar conflito de horário", async () => {
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([
      roomRow,
    ] as any);
    await expect(service.create(createInput as any, "ADMIN")).rejects.toThrow(
      "Conflito de horário",
    );
  });
});

describe("RoomService.update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve atualizar uma sala existente como admin", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([]);
    vi.mocked(roomRepository.update).mockResolvedValue({
      ...roomRow,
      title: "Daily atualizada",
    } as any);

    const updated = await service.update(
      roomRow.id,
      { title: "Daily atualizada" } as any,
      "ADMIN",
    );
    expect(updated?.title).toBe("Daily atualizada");
  });

  it("deve lançar erro para sala inexistente", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(null);
    await expect(
      service.update("nao-existe", {} as any, "ADMIN"),
    ).rejects.toThrow("Sala não encontrada");
  });

  it("deve negar acesso para usuário comum", async () => {
    await expect(service.update(roomRow.id, {} as any, "USER")).rejects.toThrow(
      "Acesso negado",
    );
  });
});

describe("RoomService.remove", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve remover uma sala como admin", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    vi.mocked(roomRepository.remove).mockResolvedValue(true);
    await expect(service.remove(roomRow.id, "ADMIN")).resolves.toBe(true);
  });

  it("deve negar acesso para usuário comum sem ser o dono", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue({
      ...roomRow,
      createdBy: "user-1",
    } as any);
    await expect(service.remove(roomRow.id, "USER")).rejects.toThrow(
      "Acesso negado",
    );
  });

  it("deve permitir que o dono (USER) cancele a própria reserva", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue({
      ...roomRow,
      createdBy: "user-1",
    } as any);
    vi.mocked(roomRepository.remove).mockResolvedValue(true);
    await expect(
      service.remove(roomRow.id, "USER", "user-1"),
    ).resolves.toBe(true);
  });

  it("deve impedir USER de cancelar reserva de outro usuário", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue({
      ...roomRow,
      createdBy: "user-1",
    } as any);
    await expect(
      service.remove(roomRow.id, "USER", "user-2"),
    ).rejects.toThrow("Acesso negado");
    expect(roomRepository.remove).not.toHaveBeenCalled();
  });
});

describe("RoomService.join", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deve adicionar o usuário aos participantes da sala", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    vi.mocked(roomRepository.update).mockResolvedValue({
      ...roomRow,
      participants: [...roomRow.participants, "joao2"],
    } as any);

    const room = await service.join(roomRow.id, "joao2");
    expect(roomRepository.update).toHaveBeenCalledWith(roomRow.id, {
      participants: [...roomRow.participants, "joao2"],
    });
    expect(room?.participants).toContain("joao2");
  });

  it("não deve duplicar participante que já está na sala", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    const room = await service.join(roomRow.id, "maria");
    expect(roomRepository.update).not.toHaveBeenCalled();
    expect(room?.participants).toEqual(roomRow.participants);
  });

  it("deve lançar erro para sala inexistente", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(null);
    await expect(service.join("nao-existe", "maria")).rejects.toThrow(
      "Sala não encontrada",
    );
  });
});
