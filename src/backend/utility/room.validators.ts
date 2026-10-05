import { z } from "zod";
import { Recurces } from "../entity/room";

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
    .min(15, "Duração mínima é de 15 minutos")
    .max(240, "Duração máxima é de 4 horas (240 minutos)"),
  resources: z.array(resourceEnum).optional().default([]),
};

export const createRoomSchema = z.object(baseRoomFields);

export const updateRoomSchema = z.object({
  title: baseRoomFields.title.optional(),
  roomName: baseRoomFields.roomName.optional(),
  description: baseRoomFields.description.optional(),
  participants: baseRoomFields.participants.optional(),
  startAt: baseRoomFields.startAt.optional(),
  durationMinutes: baseRoomFields.durationMinutes.optional(),
  resources: baseRoomFields.resources.optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
