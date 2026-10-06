import { z } from "zod";
import { Recurces } from "../entity/room.types";
import {
  BUSINESS_HOURS_LABEL,
  checkSchedule,
  scheduleViolationMessage,
} from "./schedule";

const PHYSICAL_ROOMS = [
  "Sala A",
  "Sala B",
  "Sala C",
  "Sala D",
  "Sala E",
  "Sala F",
  "Sala G",
] as const;

export const AVAILABLE_ROOMS = [...PHYSICAL_ROOMS];

const resourceEnum = z.nativeEnum(Recurces);

const baseRoomFields = {
  title: z
    .string()
    .min(3, "Nome da reunião deve ter no mínimo 3 caracteres")
    .max(150),
  roomName: z.enum(PHYSICAL_ROOMS, {
    errorMap: () => ({ message: "Selecione uma sala válida" }),
  }),
  description: z.string().max(2000).optional().default(""),
  participants: z
    .array(z.string().email("Participante com e-mail inválido"))
    .max(50, "Máximo de 50 participantes")
    .optional()
    .default([]),
  startAt: z.coerce.date().refine(
    (value) => value.getTime() > Date.now() - 30 * 1000,
    "A reserva não pode ser no passado",
  ),
  durationMinutes: z
    .number({ invalid_type_error: "Duração é obrigatória" })
    .int("Duração deve ser inteira")
    .min(15, "Duração mínima é de 15 minutos"),
  maxDurationMinutes: z
    .number({ invalid_type_error: "Informe a duração máxima da sala" })
    .int("A duração máxima deve ser inteira")
    .min(15, "A duração máxima da sala deve ser no mínimo 15 minutos")
    .max(1440, "A duração máxima da sala deve ser no máximo 24 horas (1440 minutos)")
    .optional()
    .default(240),
  resources: z.array(resourceEnum).optional().default([]),
};

export const createRoomSchema = z
  .object(baseRoomFields)
  .refine((data) => data.durationMinutes <= data.maxDurationMinutes, {
    message:
      "A duração não pode ser maior que a duração máxima permitida para a sala",
    path: ["durationMinutes"],
  })
  .refine(
    (data) =>
      checkSchedule(new Date(data.startAt), data.durationMinutes) === null,
    {
      message: `Reservas só podem ser feitas em dias úteis, ${BUSINESS_HOURS_LABEL}`,
      path: ["startAt"],
    },
  );

export function scheduleErrorFor(
  startAt: Date,
  durationMinutes: number,
): string | null {
  const violation = checkSchedule(startAt, durationMinutes);
  return violation ? scheduleViolationMessage(violation) : null;
}

export const updateRoomSchema = z.object({
  title: baseRoomFields.title.optional(),
  roomName: baseRoomFields.roomName.optional(),
  description: baseRoomFields.description.optional(),
  participants: baseRoomFields.participants.optional(),
  startAt: baseRoomFields.startAt.optional(),
  durationMinutes: baseRoomFields.durationMinutes.optional(),
  maxDurationMinutes: baseRoomFields.maxDurationMinutes.optional(),
  resources: baseRoomFields.resources.optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
