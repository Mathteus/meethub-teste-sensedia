import { Recurces } from "@/backend/entity/room";
import { Button } from "@base-ui/react";
import { Badge, MapPinIcon, ClockIcon, UsersIcon } from "lucide-react";
import { RoomResource, CreateRoomDialog } from "./create-room";
import { DeleteRoomDialog } from "./delete-room-dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./ui/card";

import { Option } from "@/components/ui/multi-select";
import { format } from "date-fns";

export const ROOM_RESOURCES: Option[] = [
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

export interface RoomFilters {
  date: string | null;
  q: string | null;
  resources: string[];
  minParticipants: number | null;
}

export function formatRange(startAt: string, durationMinutes: number) {
  let duration: string;

  if (durationMinutes >= 60) {
    duration = `${Math.floor(durationMinutes / 60)}h${
      durationMinutes % 60 ? ` ${durationMinutes % 60}min` : ""
    }`;
  } else {
    duration = `${durationMinutes} min`;
  }

  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return {
    date: format(start, "dd/MM/yyyy"),
    time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
    duration,
  };
}

export function formatMaxDuration(maxDurationMinutes?: number) {
  const minutes = maxDurationMinutes ?? 240;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h máx`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h${minutes % 60} máx`;
  return `${minutes}min máx`;
}

export interface CardRoomProps extends RoomResource {
  isAdmin: boolean;
  currentUserId?: string;
  onEdit: (room: RoomResource) => void;
  onOpenDetails: (room: RoomResource) => void;
}

export function CardRoom(props: CardRoomProps) {
  const span = formatRange(props.startAt, props.durationMinutes);
  const canDelete = props.isAdmin || props.createdBy === props.currentUserId;
  return (
    <Card
      className="flex h-full cursor-pointer flex-col transition-shadow hover:shadow-md"
      onClick={() => props.onOpenDetails(props)}
    >
      <CardHeader>
        <div>
          <Badge variant="secondary" className="gap-1 mb-2">
            <MapPinIcon className="size-3" /> {props.roomName}
          </Badge>
        </div>
        <CardTitle className="text-lg">{props.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {props.description || "Sem descrição"}
        </CardDescription>
        <CardAction className="flex flex-col items-end gap-1">
          <div className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
            <ClockIcon className="size-3.5" /> {span.time}
          </div>
          <div className="text-xs text-muted-foreground">{span.date}</div>
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Badge variant="outline" className="text-xs">
              {span.duration}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {formatMaxDuration(props.maxDurationMinutes)}
            </Badge>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="flex items-start gap-2 text-sm">
          <UsersIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <span>
            {props.participants.length > 0
              ? `${props.participants.length} participante(s): ${props.participants.join(", ")}`
              : "Nenhum participante cadastrado"}
          </span>
        </p>
      </CardContent>
      <CardFooter className="mt-auto flex flex-wrap items-center gap-2 justify-start">
        {props.resources.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Nenhum resource selecionado
          </span>
        ) : (
          props.resources.map((item) => (
            <Badge variant="default" key={`${props.id}-${item}`}>
              {item}
            </Badge>
          ))
        )}
        {(props.isAdmin || canDelete) && (
          <div
            className="ml-auto inline-flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {props.isAdmin && <CreateRoomDialog room={props} />}
            {canDelete && (
              <DeleteRoomDialog
                roomId={props.id}
                roomTitle={props.title}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    Cancelar presença
                  </Button>
                }
              />
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
