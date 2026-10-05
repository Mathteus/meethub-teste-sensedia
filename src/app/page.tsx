"use client";

import {
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  PaletteIcon,
  ShieldIcon,
  Loader2Icon,
  PencilIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
} from "lucide-react";

import { ptBR } from "date-fns/locale";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTheme } from "next-themes";
import { Badge } from "@/components/ui/badge";
import { MultiSelect, Option } from "@/components/ui/multi-select";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useAuth, type Role } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import {
  SearchAutocomplete,
  AutocompleteOption,
} from "@/components/ui/search-autocomplete";
import { Input } from "@/components/ui/input";
import { CreateRoomDialog, type RoomResource } from "@/components/create-room";
import { DeleteRoomDialog } from "@/components/delete-room-dialog";
import { RealTimeClock } from "@/components/realtime-clock";
import { Recurces } from "@/backend/entity/room";

const PARTICIPANTS: AutocompleteOption[] = [
  { label: "Adriele Brito Santos", value: "usr_1" },
  { label: "Lucas Silva", value: "usr_2" },
  { label: "Gabriel Santos", value: "usr_3" },
  { label: "Mariana Oliveira", value: "usr_4" },
  { label: "Beatriz Costa", value: "usr_5" },
];

const ROOM_RESOURCES: Option[] = [
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

async function fetchRooms(): Promise<RoomResource[]> {
  const res = await fetch("/api/rooms", {
    credentials: "include",
    cache: "no-store",
  });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error("Falha ao carregar salas");
  const data = await res.json();
  return (data.rooms ?? []) as RoomResource[];
}

function formatRange(startAt: string, durationMinutes: number) {
  const start = new Date(startAt);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  return {
    date: format(start, "dd/MM/yyyy"),
    time: `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
    duration:
      durationMinutes >= 60
        ? `${Math.floor(durationMinutes / 60)}h${
            durationMinutes % 60 ? ` ${durationMinutes % 60}min` : ""
          }`
        : `${durationMinutes} min`,
  };
}

interface CardRoomProps extends RoomResource {
  isAdmin: boolean;
  onEdit: (room: RoomResource) => void;
}

function CardRoom(props: CardRoomProps) {
  const span = formatRange(props.startAt, props.durationMinutes);
  return (
    <div className="p-2">
      <Card className="h-full">
        <CardHeader>
          <div>
            <Badge variant="secondary" className="gap-1 mb-1">
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
            <div className="text-xs text-muted-foreground">{span.duration}</div>
            {props.isAdmin && (
              <div className="flex items-center gap-1 pt-2">
                <DeleteRoomDialog
                  roomId={props.id}
                  roomTitle={props.title}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <PencilIcon className="hidden" />
                    </Button>
                  }
                />
              </div>
            )}
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
        <CardFooter className="flex flex-wrap items-center gap-2 justify-start">
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
          {props.isAdmin && (
            <div className="ml-auto inline-flex items-center gap-2">
              <CreateRoomDialog room={props} />
              <DeleteRoomDialog roomId={props.id} roomTitle={props.title} />
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, status, signout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [minParticipants, setMinParticipants] = useState<string>("");
  const [editingRoom, setEditingRoom] = useState<RoomResource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: fetchRooms,
    staleTime: 1000 * 60,
    enabled: status !== "loading",
    refetchOnMount: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const changeTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const initials = user
    ? user.username
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .join("") || "??"
    : "..";

  const isAdmin = user?.role === "ADMIN";

  const filteredRooms = useMemo(() => {
    let rooms = roomsQuery.data ?? [];

    if (date) {
      rooms = rooms.filter((r) => isSameDay(new Date(r.startAt), date));
    }

    if (selectedResources.length > 0) {
      rooms = rooms.filter((r) => {
        const resources = r.resources as unknown as string[];
        return selectedResources.some((sel) => resources.includes(sel));
      });
    }

    const searchTerm = search.trim().toLowerCase();
    if (searchTerm) {
      rooms = rooms.filter((r) => {
        if (r.title.toLowerCase().includes(searchTerm)) return true;
        if (r.description.toLowerCase().includes(searchTerm)) return true;
        if (r.roomName.toLowerCase().includes(searchTerm)) return true;
        if (r.participants.some((p) => p.toLowerCase().includes(searchTerm)))
          return true;
        return false;
      });
    }

    const min = Number(minParticipants);
    if (minParticipants && !isNaN(min) && min >= 0) {
      rooms = rooms.filter((r) => r.participants.length >= min);
    }

    return rooms.sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [roomsQuery.data, date, selectedResources, search, minParticipants]);

  if (status === "loading" || roomsQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <Loader2Icon className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <header className="flex items-center py-4 px-10 bg-blue-900 justify-between border-b-solid border-b-black border-b-2 fixed w-full z-50 gap-4 flex-wrap">
        <div>
          <h1 className="font-extrabold text-white dark:text-white text-2xl md:text-3xl">
            MeetHub
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2 ml-auto mr-2">
          <Badge variant="secondary" className="gap-1.5">
            {user.role === "ADMIN" ? (
              <ShieldIcon className="size-3.5" />
            ) : (
              <BadgeCheckIcon className="size-3.5" />
            )}
            <span className="text-xs">
              {user.role === "ADMIN" ? "Administrador" : "Usuário"}
            </span>
          </Badge>
          <span className="text-sm text-white/90 font-medium">
            Olá, {user.username}
          </span>
        </div>
        <div className="hidden lg:block">
          <RealTimeClock className="text-sm" />
        </div>
        <div>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-12">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt={user.username}
                  />
                  <AvatarFallback className="bg-blue-700 text-white font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  {user.username}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BadgeCheckIcon />
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={changeTheme}>
                  <PaletteIcon />
                  Trocar tema
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BellIcon />
                  Notificações
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signout()}>
                <LogOutIcon />
                Deslogar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="py-6 px-10 mt-24 lg:mt-20">
        <section className="mb-4 flex flex-wrap items-center justify-center gap-2">
          <div className="px-2">
            <Popover>
              <PopoverTrigger>
                <Button
                  variant="outline"
                  data-empty={!date}
                  className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground w-[240px]"
                >
                  <CalendarIcon />
                  {date ? (
                    format(date, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar selected={date} onSelect={setDate} locale={ptBR} />
              </PopoverContent>
            </Popover>
          </div>
          <div className="px-2">
            <SearchAutocomplete
              options={PARTICIPANTS}
              value={search}
              onValueChange={setSearch}
              placeholder="Digite para buscar reunião ou participante..."
              emptyMessage="Nenhum resultado encontrado."
            />
          </div>
          <div className="px-2 w-full md:w-[320px]">
            <MultiSelect
              options={ROOM_RESOURCES}
              selected={selectedResources}
              onChange={setSelectedResources}
              placeholder="Selecione os recursos..."
            />
          </div>
          <div className="px-2">
            <Input
              type="number"
              min={0}
              value={minParticipants}
              onChange={(e) => setMinParticipants(e.target.value)}
              placeholder="Nº mínimo de participantes"
              className="w-[220px]"
            />
          </div>
          {isAdmin && (
            <div className="px-2">
              <CreateRoomDialog
                open={dialogOpen}
                onOpenChange={(next) => {
                  setDialogOpen(next);
                  if (!next) setEditingRoom(null);
                }}
                room={editingRoom}
              />
            </div>
          )}
        </section>

        <section className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 border-solid border-black border rounded-lg dark:border-white min-h-[300px]">
          {roomsQuery.isError && (
            <div className="col-span-full text-center text-sm text-destructive">
              Erro ao carregar reservas: {(roomsQuery.error as Error).message}
            </div>
          )}
          {!roomsQuery.isError && filteredRooms.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
              <CalendarIcon className="size-8 opacity-40" />
              <p className="text-sm">
                Nenhuma reserva encontrada para os filtros selecionados.
              </p>
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingRoom(null);
                    setDialogOpen(true);
                  }}
                >
                  Criar primeira reserva
                </Button>
              )}
            </div>
          ) : (
            filteredRooms.map((item) => {
              return (
                <CardRoom
                  key={item.id}
                  {...item}
                  isAdmin={isAdmin}
                  onEdit={(room) => {
                    setEditingRoom(room);
                    setDialogOpen(true);
                  }}
                />
              );
            })
          )}
        </section>
      </main>
    </>
  );
}
