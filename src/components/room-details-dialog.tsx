"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ClockIcon, MapPinIcon, UsersIcon, Loader2Icon } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { RoomResource } from "@/components/create-room";
import { useAuth } from "@/lib/auth/auth-provider";

interface RoomDetailsDialogProps {
  room: RoomResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoomDetailsDialog({
  room,
  open,
  onOpenChange,
}: RoomDetailsDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isParticipant =
    !!room && !!user && room.participants.includes(user.username);

  async function handleJoin() {
    if (!room) return;
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/rooms/${room.id}/join`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Erro ao participar");
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro interno");
    } finally {
      setLoading(false);
    }
  }

  if (!room) return null;

  const start = new Date(room.startAt);
  const end = new Date(start.getTime() + room.durationMinutes * 60 * 1000);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <Badge variant="secondary" className="w-fit gap-1">
            <MapPinIcon className="size-3" /> {room.roomName}
          </Badge>
          <DialogTitle className="text-xl">{room.title}</DialogTitle>
          <DialogDescription>
            {room.description || "Sem descrição"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <ClockIcon className="size-4" />
            {format(start, "dd/MM/yyyy")} · {format(start, "HH:mm")} -{" "}
            {format(end, "HH:mm")} ({room.durationMinutes} min)
            <span className="text-xs">
              Limite desta sala: {room.maxDurationMinutes ?? 240} min
            </span>
          </p>

          <div>
            <p className="mb-1 flex items-center gap-2 font-medium">
              <UsersIcon className="size-4 text-muted-foreground" />
              Participantes ({room.participants.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {room.participants.length === 0 ? (
                <span className="text-muted-foreground">
                  Nenhum participante ainda
                </span>
              ) : (
                room.participants.map((p) => (
                  <Badge key={p} variant="outline">
                    {p}
                  </Badge>
                ))
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {room.resources.map((r) => (
              <Badge key={r} variant="default">
                {r}
              </Badge>
            ))}
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleJoin}
            disabled={loading || isParticipant}
          >
            {loading ? (
              <>
                <Loader2Icon className="animate-spin" /> Entrando...
              </>
            ) : isParticipant ? (
              "Você já participa"
            ) : (
              "Participar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
