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

import { format } from "date-fns";
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
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateRoomDialog, type RoomResource } from "@/components/create-room";
import { DeleteRoomDialog } from "@/components/delete-room-dialog";
import { RoomDetailsDialog } from "@/components/room-details-dialog";
import { RealTimeClock } from "@/components/realtime-clock";
import { Recurces } from "@/backend/entity/room.types";

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

interface RoomFilters {
  date: string | null;
  q: string | null;
  resources: string[];
  minParticipants: number | null;
}

async function fetchRooms(
  filters: RoomFilters,
  mine: boolean,
): Promise<RoomResource[]> {
  const params = new URLSearchParams();
  if (mine) params.set("mine", "true");
  else {
    if (filters.date) params.set("date", filters.date);
    if (filters.q) params.set("q", filters.q);
    if (filters.resources.length > 0)
      params.set("resources", filters.resources.join(","));
    if (filters.minParticipants !== null)
      params.set("minParticipants", String(filters.minParticipants));
  }

  const res = await fetch(`/api/rooms?${params.toString()}`, {
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

function formatMaxDuration(maxDurationMinutes?: number) {
  const minutes = maxDurationMinutes ?? 240;
  if (minutes >= 60 && minutes % 60 === 0) return `${minutes / 60}h máx`;
  if (minutes >= 60) return `${Math.floor(minutes / 60)}h${minutes % 60} máx`;
  return `${minutes}min máx`;
}

interface CardRoomProps extends RoomResource {
  isAdmin: boolean;
  currentUserId?: string;
  onEdit: (room: RoomResource) => void;
  onOpenDetails: (room: RoomResource) => void;
}

function CardRoom(props: CardRoomProps) {
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

export default function Home() {
  const router = useRouter();
  const { user, status, signout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [editingRoom, setEditingRoom] = useState<RoomResource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsRoom, setDetailsRoom] = useState<RoomResource | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tab, setTab] = useState<"all" | "mine">("all");

  const [filters, setFilters] = useQueryStates({
    date: parseAsString,
    q: parseAsString.withDefault(""),
    resources: parseAsArrayOf(parseAsString).withDefault([]),
    minParticipants: parseAsInteger,
  });

  const [searchInput, setSearchInput] = useState(filters.q);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.q) {
        setFilters({ q: searchInput || null });
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const roomsQuery = useQuery({
    queryKey: ["rooms", filters, tab],
    queryFn: () => fetchRooms(filters, tab === "mine"),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
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

  const selectedDate = filters.date
    ? new Date(`${filters.date}T00:00:00`)
    : undefined;

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
      <header className="fixed z-50 flex w-full flex-wrap items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-4 backdrop-blur md:px-10">
        <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          MeetHub
        </h1>
        <div className="ml-auto mr-2 hidden items-center gap-2 md:flex">
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
          <span className="text-sm font-medium text-muted-foreground">
            Olá, {user.username}
          </span>
        </div>
        <div className="hidden lg:block">
          <RealTimeClock className="text-sm text-muted-foreground" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="size-10">
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt={user.username}
                />
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
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
      </header>

      <main className="mt-24 px-4 py-6 md:px-10 lg:mt-20">
        <Card className="mb-6">
          <CardContent className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!selectedDate}
                  className="justify-start text-left font-normal data-[empty=true]:text-muted-foreground w-full"
                >
                  <CalendarIcon />
                  {selectedDate ? (
                    format(selectedDate, "PPP", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  selected={selectedDate}
                  onSelect={(d) =>
                    setFilters({ date: d ? format(d, "yyyy-MM-dd") : null })
                  }
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar reunião ou participante..."
            />

            <MultiSelect
              options={ROOM_RESOURCES}
              selected={filters.resources}
              onChange={(v) => setFilters({ resources: v.length ? v : null })}
              placeholder="Selecione os recursos..."
            />

            <Input
              type="number"
              min={0}
              value={filters.minParticipants ?? ""}
              onChange={(e) =>
                setFilters({
                  minParticipants: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              placeholder="Nº mínimo de participantes"
            />

            {isAdmin && (
              <div className="sm:col-span-2 lg:col-span-4">
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
          </CardContent>
        </Card>

        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as "all" | "mine")}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">Todas as Salas</TabsTrigger>
            <TabsTrigger value="mine">Minhas Salas</TabsTrigger>
          </TabsList>
        </Tabs>

        <section className="grid min-h-[300px] grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roomsQuery.isError && (
            <div className="col-span-full text-center text-sm text-destructive">
              Erro ao carregar reservas: {(roomsQuery.error as Error).message}
            </div>
          )}
          {!roomsQuery.isError && (roomsQuery.data?.length ?? 0) === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
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
            roomsQuery.data?.map((item) => (
              <CardRoom
                key={item.id}
                {...item}
                isAdmin={isAdmin}
                currentUserId={user.id}
                onEdit={(room) => {
                  setEditingRoom(room);
                  setDialogOpen(true);
                }}
                onOpenDetails={(room) => {
                  setDetailsRoom(room);
                  setDetailsOpen(true);
                }}
              />
            ))
          )}
        </section>
      </main>

      <RoomDetailsDialog
        room={detailsRoom}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
}
