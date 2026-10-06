import { describe, it, expect } from "vitest";
import {
  createRoomSchema,
  updateRoomSchema,
} from "./room.validators";
import { Recurces } from "../entity/room.types";

describe("Room Validators - maxDurationMinutes logic", () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

  it("deve aceitar criação de sala com duração dentro do limite específico da sala", () => {
    const input = {
      title: "Planejamento Estratégico",
      roomName: "Sala A",
      description: "Reunião de 2h na sala com limite de 2h",
      startAt: futureDate,
      durationMinutes: 120,
      maxDurationMinutes: 120,
      resources: [Recurces.WIFI],
      participants: ["test@meethub.com"],
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("deve rejeitar criação quando a duração da reserva excede a duração máxima da sala", () => {
    const input = {
      title: "Workshop Longo",
      roomName: "Sala B",
      startAt: futureDate,
      durationMinutes: 180,
      maxDurationMinutes: 120, // limite da sala é 2h, mas reserva pede 3h
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      expect(fieldErrors.durationMinutes).toBeDefined();
      expect(fieldErrors.durationMinutes?.[0]).toContain(
        "A duração não pode ser maior que a duração máxima permitida",
      );
    }
  });

  it("deve permitir duração maior que o antigo limite fixo de 4h (240min) se a sala tiver limite maior", () => {
    const input = {
      title: "Treinamento All-Day",
      roomName: "Sala C",
      startAt: futureDate,
      durationMinutes: 480, // 8h
      maxDurationMinutes: 480, // limite da sala é 8h
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.durationMinutes).toBe(480);
      expect(parsed.data.maxDurationMinutes).toBe(480);
    }
  });

  it("deve rejeitar maxDurationMinutes menor que 15 minutos", () => {
    const input = {
      title: "Reunião Rápida",
      roomName: "Sala A",
      startAt: futureDate,
      durationMinutes: 15,
      maxDurationMinutes: 10,
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      expect(fieldErrors.maxDurationMinutes).toBeDefined();
    }
  });

  it("deve rejeitar maxDurationMinutes maior que 1440 minutos (24 horas)", () => {
    const input = {
      title: "Reunião Infinita",
      roomName: "Sala A",
      startAt: futureDate,
      durationMinutes: 60,
      maxDurationMinutes: 2000,
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      expect(fieldErrors.maxDurationMinutes).toBeDefined();
    }
  });

  it("deve usar padrão de 240 minutos para maxDurationMinutes se não informado", () => {
    const input = {
      title: "Reunião Padrão",
      roomName: "Sala A",
      startAt: futureDate,
      durationMinutes: 60,
    };

    const parsed = createRoomSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.maxDurationMinutes).toBe(240);
    }
  });

  it("deve validar campos no schema de update", () => {
    const updateInput = {
      maxDurationMinutes: 360,
      durationMinutes: 180,
    };

    const parsed = updateRoomSchema.safeParse(updateInput);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.maxDurationMinutes).toBe(360);
      expect(parsed.data.durationMinutes).toBe(180);
    }
  });
});
