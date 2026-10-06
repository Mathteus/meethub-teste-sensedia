"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trash2Icon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteRoomDialogProps {
  roomId: string;
  roomTitle?: string;
  trigger?: React.ReactNode;
}

export function DeleteRoomDialog({
  roomId,
  roomTitle,
  trigger,
}: DeleteRoomDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleDelete() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message ?? "Erro ao excluir");
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro interno");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          trigger && React.isValidElement(trigger) ? (
            trigger
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
            />
          )
        }
      >
        {trigger && React.isValidElement(trigger) ? (
          (trigger.props as { children?: React.ReactNode }).children
        ) : (
          <Trash2Icon />
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir reserva?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Você realmente quer excluir a
            reserva{" "}
            {roomTitle ? (
              <strong className="text-foreground">“{roomTitle}”</strong>
            ) : null}
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            size={undefined}
            variant={undefined}
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={loading}
            className="bg-destructive hover:bg-destructive text-destructive-foreground"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2Icon className="animate-spin" size={14} /> Excluindo...
              </span>
            ) : (
              "Sim, excluir"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
