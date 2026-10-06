import { Room } from "../entity/room";
import { Recurces } from "../entity/room.types";
import { roomRepository } from "../repository/room.repository";
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from "../utility/room.validators";
import type { RoomSelect } from "../database/schema/rooms";
import type { Role } from "../entity/account.entity";
import { assertSchedule } from "../utility/schedule";

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function serializeRoom(r: RoomSelect) {
  return {
    id: r.id,
    title: r.title,
    roomName: r.roomName,
    description: r.description,
    participants: [...r.participants],
    startAt: r.startAt,
    durationMinutes: r.durationMinutes,
    maxDurationMinutes: r.maxDurationMinutes,
    endAt: addMinutes(r.startAt, r.durationMinutes),
    resources: (r.resources as Recurces[]) ?? [],
    createdBy: r.createdBy ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function ensureAdmin(role: Role | "USER" | "ADMIN" | undefined) {
  if (role !== "ADMIN") {
    throw new Error(
      "Acesso negado: apenas administradores podem gerenciar salas",
    );
  }
}

function validateDuration(durationMinutes: number, maxDurationMinutes: number) {
  if (maxDurationMinutes < 15 || maxDurationMinutes > 1440) {
    throw new Error(
      "Duração máxima da sala deve ser entre 15 minutos e 24 horas",
    );
  }
  if (durationMinutes < 15) {
    throw new Error("Duração mínima é de 15 minutos");
  }
  if (durationMinutes > maxDurationMinutes) {
    throw new Error(
      `Duração excede o limite desta sala (máximo de ${maxDurationMinutes} minutos)`,
    );
  }
}

export class RoomService {
  async list() {
    const rows = await roomRepository.findAll();
    return rows.map(serializeRoom);
  }

  async listFiltered(
    filters: Parameters<typeof roomRepository.findFiltered>[0],
  ) {
    const rows = await roomRepository.findFiltered(filters);
    return rows.map(serializeRoom);
  }

  async listByCreator(createdBy: string) {
    const rows = await roomRepository.findByCreatedBy(createdBy);
    return rows.map(serializeRoom);
  }

  async getById(id: string) {
    const row = await roomRepository.findById(id);
    return row ? serializeRoom(row) : null;
  }

  async create(
    input: CreateRoomInput & { createdBy?: string },
    actorRole?: Role | "USER" | "ADMIN",
  ) {
    ensureAdmin(actorRole);

    const date = new Date(input.startAt);
    if (date.getTime() <= Date.now() - 30 * 1000) {
      throw new Error("Não é possível criar uma reserva no passado");
    }

    const maxDurationMinutes = input.maxDurationMinutes ?? 240;
    validateDuration(input.durationMinutes, maxDurationMinutes);
    assertSchedule(date, input.durationMinutes);

    const room = new Room({
      title: input.title,
      description: input.description,
      participants: input.participants,
      date,
      resource: input.resources as Recurces[],
      duration: input.durationMinutes,
    });

    const endAt = addMinutes(room.date, room.duration);

    const conflicts = await roomRepository.findByRoomNameAndOverlap(
      input.roomName,
      room.date,
      endAt,
    );

    if (conflicts.length > 0) {
      throw new Error(
        "Conflito de horário: já existe uma reserva para esta sala no horário informado",
      );
    }

    const created = await roomRepository.create({
      id: room.id,
      title: room.title,
      roomName: input.roomName,
      description: room.description,
      participants: room.participants,
      startAt: room.date,
      durationMinutes: room.duration,
      maxDurationMinutes,
      resources: room.resource as unknown as RoomSelect["resources"],
      createdBy: input.createdBy,
    });

    return serializeRoom(created);
  }

  async update(
    id: string,
    input: UpdateRoomInput,
    actorRole?: Role | "USER" | "ADMIN",
  ) {
    ensureAdmin(actorRole);
    const existing = await roomRepository.findById(id);
    if (!existing) {
      throw new Error("Sala não encontrada");
    }

    const startAt = input.startAt ? new Date(input.startAt) : existing.startAt;
    const durationMinutes = input.durationMinutes ?? existing.durationMinutes;
    const roomName = input.roomName ?? existing.roomName;
    const title = input.title ?? existing.title;
    const description =
      input.description !== undefined
        ? input.description
        : existing.description;
    const participants =
      input.participants !== undefined
        ? input.participants
        : existing.participants;
    const resources = (
      input.resources !== undefined
        ? input.resources
        : (existing.resources as Recurces[])
    ) as Recurces[];

    if (startAt.getTime() <= Date.now() - 30 * 1000) {
      throw new Error("Não é possível agendar uma reserva no passado");
    }

    const maxDurationMinutes =
      input.maxDurationMinutes ?? existing.maxDurationMinutes ?? 240;
    validateDuration(durationMinutes, maxDurationMinutes);
    assertSchedule(startAt, durationMinutes);

    const endAt = addMinutes(startAt, durationMinutes);

    const conflicts = await roomRepository.findByRoomNameAndOverlap(
      roomName,
      startAt,
      endAt,
      existing.id,
    );

    if (conflicts.length > 0) {
      throw new Error(
        "Conflito de horário: já existe uma reserva para esta sala no horário informado",
      );
    }

    /*const _ = new Room({
      id: existing.id,
      title,
      description,
      participants,
      date: startAt,
      resource: resources,
      duration: durationMinutes,
    });*/

    const updated = await roomRepository.update(existing.id, {
      title,
      roomName,
      description,
      participants,
      startAt,
      durationMinutes,
      maxDurationMinutes,
      resources: resources as unknown as RoomSelect["resources"],
    });

    return updated ? serializeRoom(updated) : null;
  }

  async join(id: string, username: string) {
    const existing = await roomRepository.findById(id);
    if (!existing) throw new Error("Sala não encontrada");

    if (existing.participants.includes(username)) {
      return serializeRoom(existing);
    }

    const updated = await roomRepository.update(existing.id, {
      participants: [...existing.participants, username],
    });
    return updated ? serializeRoom(updated) : null;
  }

  async remove(
    id: string,
    actorRole?: Role | "USER" | "ADMIN",
    actorId?: string,
  ) {
    const existing = await roomRepository.findById(id);
    if (!existing) throw new Error("Sala não encontrada");

    const isOwner = !!actorId && existing.createdBy === actorId;
    if (actorRole !== "ADMIN" && !isOwner) {
      throw new Error(
        "Acesso negado: apenas administradores ou o criador podem cancelar a reserva",
      );
    }

    return roomRepository.remove(existing.id);
  }
}

export const roomService = new RoomService();
