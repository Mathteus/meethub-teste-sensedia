"use client";

import * as React from "react";
import { PlusIcon, PencilIcon, Loader2Icon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { CalendarIcon, ClockIcon, UsersIcon, MapPinIcon } from "lucide-react";
import {
  MultiSelect,
  Option as MultiSelectOption,
} from "@/components/ui/multi-select";
import { Recurces } from "@/backend/entity/room.types";
import { AVAILABLE_ROOMS } from "@/backend/utility/room.validators";
import { useAuth } from "@/lib/auth/auth-provider";
import { Select, SelectItem } from "./ui/select";

export interface RoomResource {
  id: string;
  title: string;
  roomName: string;
  description: string;
  participants: string[];
  startAt: string;
  durationMinutes: number;
  resources: Recurces[];
  createdBy: string | null;
}

interface RoomFormData {
  title: string;
  roomName: string;
  description: string;
  participants: string[];
  startDate: string;
  startTime: string;
  durationMinutes: number;
  resources: Recurces[];
}

const RESOURCES_OPTIONS: MultiSelectOption[] = [
  { label: "Wi-Fi", value: Recurces.WIFI },
  { label: "Projetor", value: Recurces.PROJECTOR },
  { label: "Smart TV", value: Recurces.SMART_TV },
  { label: "Câmera", value: Recurces.CAMERA },
  { label: "Mesa de Som", value: Recurces.MIXING_CONSOLE },
  { label: "Ar-Condicionado", value: Recurces.AIR_CONDITIONING },
  { label: "Carregadores", value: Recurces.CHARGERS },
  { label: "Lousa Interativa", value: Recurces.LOUSA_INTERATIVA },
  { label: "Lousa Branca", value: Recurces.WHITEBOARD },
  { label: "Poltronas", value: Recurces.ARMCHAIRS },
  { label: "Frigobar", value: Recurces.MINI_FRIDGE },
];

const DURATION_OPTIONS: { value: number; label: string }[] = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora e 30 min" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
];

function toDateAndTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = d.toISOString().slice(0, 10);
  const time = d.toISOString().slice(11, 16);
  return { date, time };
}

function emptyForm(): RoomFormData {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const { date, time } = toDateAndTime(tomorrow.toISOString());
  return {
    title: "",
    roomName: AVAILABLE_ROOMS[0],
    description: "",
    participants: [],
    startDate: date,
    startTime: time,
    durationMinutes: 60,
    resources: [],
  };
}

function parseForm(form: RoomFormData) {
  const startAt = new Date(
    `${form.startDate}T${form.startTime}:00`,
  ).toISOString();
  return {
    title: form.title,
    roomName: form.roomName,
    description: form.description,
    participants: form.participants,
    startAt,
    durationMinutes: Number(form.durationMinutes),
    resources: form.resources,
  };
}

interface CreateRoomDialogProps {
  room?: RoomResource | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateRoomDialog({
  room,
  open: controlledOpen,
  onOpenChange,
  trigger,
}: CreateRoomDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isEditing = Boolean(room);

  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    setInternalOpen(value);
  };

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [form, setForm] = React.useState<RoomFormData>(emptyForm);
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [participantInput, setParticipantInput] = React.useState("");
  const [participantError, setParticipantError] = React.useState<string | null>(
    null,
  );

  const isAdmin = user?.role === "ADMIN";

  React.useEffect(() => {
    if (!open) return;
    if (!room) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(emptyForm());
    } else {
      const { date, time } = toDateAndTime(room.startAt);
      setForm({
        title: room.title,
        roomName: room.roomName,
        description: room.description,
        participants: [...room.participants],
        startDate: date,
        startTime: time,
        durationMinutes: room.durationMinutes,
        resources: [...room.resources],
      });
    }
    setGeneralError(null);
    setParticipantError(null);
    setParticipantInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room?.id]);

  function updateField<K extends keyof RoomFormData>(
    field: K,
    value: RoomFormData[K],
  ) {
    setForm((c) => ({ ...c, [field]: value }));
  }

  function toggleResource(resource: Recurces) {
    setForm((c) => {
      const exists = c.resources.includes(resource);
      return {
        ...c,
        resources: exists
          ? c.resources.filter((r) => r !== resource)
          : [...c.resources, resource],
      };
    });
  }

  function addParticipant() {
    const email = participantInput.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setParticipantError("Informe um e-mail válido");
      return;
    }
    if (form.participants.includes(email)) {
      setParticipantError("Participante já adicionado");
      return;
    }
    setForm((c) => ({ ...c, participants: [...c.participants, email] }));
    setParticipantInput("");
    setParticipantError(null);
  }

  function removeParticipant(email: string) {
    setForm((c) => ({
      ...c,
      participants: c.participants.filter((p) => p !== email),
    }));
  }

  function validateForm(form: RoomFormData): string | null {
    if (!form.title.trim() || form.title.trim().length < 3)
      return "Nome da reunião deve ter pelo menos 3 caracteres";
    if (!form.roomName) return "Selecione uma sala";
    if (!form.startDate || !form.startTime) return "Informe data e hora";
    const startDate = new Date(`${form.startDate}T${form.startTime}:00`);
    if (isNaN(startDate.getTime())) return "Data/hora inválida";
    if (Number(form.durationMinutes) < 15 || Number(form.durationMinutes) > 240)
      return "Duração deve ser entre 15 min e 4 horas";
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneralError(null);
    const invalid = validateForm(form);
    if (invalid) {
      setGeneralError(invalid);
      return;
    }
    if (!isAdmin) {
      setGeneralError("Apenas administradores podem criar/editar salas");
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = parseForm(form);
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing ? `/api/rooms/${room!.id}` : "/api/rooms";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message ?? "Erro ao salvar sala");
      }
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Erro interno");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAdmin && !isEditing) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger && React.isValidElement(trigger) ? (
            trigger
          ) : (
            <Button type="button" />
          )
        }
      >
        {trigger && React.isValidElement(trigger) ? (
          (trigger.props as { children?: React.ReactNode }).children
        ) : (
          <>
            {isEditing ? (
              <PencilIcon className="mr-2 size-4" />
            ) : (
              <PlusIcon className="mr-2 size-4" />
            )}
            {isEditing ? "Editar sala" : "Criar sala"}
          </>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-160 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar reserva de sala" : "Criar reserva de sala"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Atualize os dados da reserva. O horário será validado contra outras reservas da mesma sala."
              : "Preencha os dados para reservar uma sala de reunião."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field>
              <Label htmlFor="title">Nome da reunião</Label>
              <Input
                id="title"
                placeholder="Ex: Reunião de equipe"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
              />
            </Field>

            <Field>
              <Label htmlFor="roomName">Sala física</Label>
              <Select
                value={form.roomName}
                onValueChange={(value) => updateField("roomName", value as any)}
              >
                {AVAILABLE_ROOMS.map((roomName) => (
                  <SelectItem key={roomName} value={roomName}>
                    <span className="flex items-center gap-2">
                      <MapPinIcon className="size-3.5" /> {roomName}
                    </span>
                  </SelectItem>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field>
              <Label htmlFor="startDate">Data</Label>
              <InputGroup>
                <InputGroupAddon>
                  <CalendarIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </InputGroup>
            </Field>
            <Field>
              <Label htmlFor="startTime">Horário de início</Label>
              <InputGroup>
                <InputGroupAddon>
                  <ClockIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(e) => updateField("startTime", e.target.value)}
                />
              </InputGroup>
            </Field>
            <Field>
              <Label htmlFor="duration">Duração</Label>
              <Select
                value={String(form.durationMinutes)}
                onValueChange={(value) =>
                  updateField("durationMinutes", Number(value) as any)
                }
              >
                {DURATION_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </Select>
            </Field>
          </div>

          <Field>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              rows={3}
              placeholder="Informações adicionais sobre a reunião..."
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
            />
          </Field>

          <Field>
            <Label>Participantes (e-mails)</Label>
            <div className="flex gap-2">
              <InputGroup className="flex-1">
                <InputGroupAddon>
                  <UsersIcon className="size-4" />
                </InputGroupAddon>
                <InputGroupInput
                  type="email"
                  placeholder="adicionar email e pressione enter ou clique em adicionar"
                  value={participantInput}
                  onChange={(e) => {
                    setParticipantInput(e.target.value);
                    if (participantError) setParticipantError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addParticipant();
                    }
                  }}
                />
              </InputGroup>
              <Button type="button" variant="outline" onClick={addParticipant}>
                Adicionar
              </Button>
            </div>
            <FieldError
              errors={[
                participantError
                  ? ({ message: participantError } as any)
                  : undefined,
              ]}
            />
            {form.participants.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {form.participants.map((email) => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs"
                  >
                    {email}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => removeParticipant(email)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </Field>

          <Field>
            <Label>Recursos da reserva</Label>
            <MultiSelect
              options={RESOURCES_OPTIONS}
              selected={form.resources as unknown as string[]}
              onChange={(sel) =>
                updateField("resources", sel as unknown as Recurces[])
              }
              placeholder="Selecione os recursos..."
              className="w-full"
            />
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RESOURCES_OPTIONS.map((opt) => {
                const checked = (
                  form.resources as unknown as string[]
                ).includes(opt.value);
                return (
                  <div
                    key={opt.value}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        toggleResource(opt.value as Recurces)
                      }
                    />
                    <span className="text-xs">{opt.label}</span>
                  </div>
                );
              })}
            </div>
          </Field>

          {generalError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {generalError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !isAdmin ||
                !form.title.trim() ||
                !form.roomName ||
                !form.startDate ||
                !form.startTime
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2Icon className="animate-spin" /> Salvando...
                </>
              ) : isEditing ? (
                "Salvar alterações"
              ) : (
                "Criar reserva"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
