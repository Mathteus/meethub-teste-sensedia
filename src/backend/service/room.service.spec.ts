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

/**
 * Próximo dia útil no horário comercial, no futuro em relação a agora.
 * Mantém as fixtures determinísticas independentemente de quando a suíte roda.
 */
function nextBusinessSlot(hour = 10, minute = 0): Date {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(hour, minute, 0, 0);
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }
  return date;
}

const roomRow = {
  id: "room-1",
  title: "Daily",
  roomName: "Sala Alfa",
  description: "Reunião diária",
  participants: ["maria", "joao"],
  startAt: nextBusinessSlot(),
  durationMinutes: 30,
  maxDurationMinutes: 240,
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
  startAt: nextBusinessSlot().toISOString(),
  durationMinutes: 30,
  maxDurationMinutes: 240,
  resources: ["Wifi"],
};

describe("RoomService.create - regras de agenda", () => {
  beforeEach(() => vi.clearAllMocks());

  /** Próximo sábado (ou domingo) no futuro. */
  function nextWeekend(hour = 14, minute = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(hour, minute, 0, 0);
    while (date.getDay() !== 6) date.setDate(date.getDate() + 1);
    return date;
  }

  it("deve criar reserva em dia útil dentro do expediente", async () => {
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([]);
    vi.mocked(roomRepository.create).mockResolvedValue(roomRow as any);

    await expect(service.create(createInput as any, "ADMIN")).resolves.toBeTruthy();
    expect(roomRepository.create).toHaveBeenCalled();
  });

  it("deve rejeitar reserva no sábado", async () => {
    await expect(
      service.create(
        { ...createInput, startAt: nextWeekend().toISOString() } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("dias úteis");
    expect(roomRepository.create).not.toHaveBeenCalled();
  });

  it("deve rejeitar reserva no domingo", async () => {
    const sunday = nextWeekend();
    sunday.setDate(sunday.getDate() + 1);
    await expect(
      service.create({ ...createInput, startAt: sunday.toISOString() } as any, "ADMIN"),
    ).rejects.toThrow("dias úteis");
  });

  it("deve rejeitar início antes das 08:00", async () => {
    await expect(
      service.create(
        { ...createInput, startAt: nextBusinessSlot(7, 0).toISOString() } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("08:00");
  });

  it("deve rejeitar término depois das 20:00", async () => {
    await expect(
      service.create(
        {
          ...createInput,
          startAt: nextBusinessSlot(19, 30).toISOString(),
          durationMinutes: 60,
        } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("20:00");
  });

  it("deve rejeitar no update quando a nova data cai no fim de semana", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    await expect(
      service.update(
        roomRow.id,
        { startAt: nextWeekend().toISOString() } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("dias úteis");
    expect(roomRepository.update).not.toHaveBeenCalled();
  });

  it("deve rejeitar no update quando o novo horário ultrapassa as 20:00", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    await expect(
      service.update(
        roomRow.id,
        {
          startAt: nextBusinessSlot(19, 30).toISOString(),
          durationMinutes: 60,
        } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("20:00");
  });

  it("deve permitir no update quando o novo horário é válido", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue(roomRow as any);
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([]);
    vi.mocked(roomRepository.update).mockResolvedValue(roomRow as any);

    await expect(
      service.update(
        roomRow.id,
        { startAt: nextBusinessSlot(9, 0).toISOString(), durationMinutes: 60 } as any,
        "ADMIN",
      ),
    ).resolves.toBeTruthy();
  });
});

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

  it("deve rejeitar duração abaixo do mínimo", async () => {
    await expect(
      service.create({ ...createInput, durationMinutes: 5 } as any, "ADMIN"),
    ).rejects.toThrow("Duração mínima");
  });

  it("deve rejeitar duração acima do limite padrão de 4 horas", async () => {
    await expect(
      service.create({ ...createInput, durationMinutes: 300 } as any, "ADMIN"),
    ).rejects.toThrow("excede o limite desta sala");
  });

  it("deve respeitar a duração máxima por sala (aceita acima de 4h)", async () => {
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([]);
    vi.mocked(roomRepository.create).mockResolvedValue({
      ...roomRow,
      durationMinutes: 480,
      maxDurationMinutes: 480,
    } as any);

    const room = await service.create(
      { ...createInput, durationMinutes: 480, maxDurationMinutes: 480 } as any,
      "ADMIN",
    );
    expect(room.durationMinutes).toBe(480);
    expect(room.maxDurationMinutes).toBe(480);
  });

  it("deve rejeitar duração maior que o limite da sala", async () => {
    await expect(
      service.create(
        { ...createInput, durationMinutes: 180, maxDurationMinutes: 60 } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("excede o limite desta sala (máximo de 60 minutos)");
  });

  it("deve rejeitar duração máxima de sala inválida", async () => {
    await expect(
      service.create(
        { ...createInput, durationMinutes: 30, maxDurationMinutes: 10 } as any,
        "ADMIN",
      ),
    ).rejects.toThrow("Duração máxima da sala");
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

  it("deve validar a duração contra o limite da sala existente no update", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue({
      ...roomRow,
      maxDurationMinutes: 60,
    } as any);
    await expect(
      service.update(roomRow.id, { durationMinutes: 120 } as any, "ADMIN"),
    ).rejects.toThrow("excede o limite desta sala (máximo de 60 minutos)");
  });

  it("deve permitir aumentar o limite da sala no update", async () => {
    vi.mocked(roomRepository.findById).mockResolvedValue({
      ...roomRow,
      maxDurationMinutes: 60,
    } as any);
    vi.mocked(roomRepository.findByRoomNameAndOverlap).mockResolvedValue([]);
    vi.mocked(roomRepository.update).mockResolvedValue({
      ...roomRow,
      durationMinutes: 300,
      maxDurationMinutes: 480,
    } as any);

    const updated = await service.update(
      roomRow.id,
      { durationMinutes: 300, maxDurationMinutes: 480 } as any,
      "ADMIN",
    );
    expect(updated?.durationMinutes).toBe(300);
    expect(updated?.maxDurationMinutes).toBe(480);
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
