"use client";

import { Loader2Icon } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import { AuthUser, useAuth } from "@/lib/auth/auth-provider";
import { useRouter } from "next/navigation";
import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  useQueryStates,
} from "nuqs";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateRoomDialog, type RoomResource } from "@/components/create-room";
import { RoomDetailsDialog } from "@/components/room-details-dialog";
import { RoomFilters, ROOM_RESOURCES, CardRoom } from "@/components/card-room";
import { HeaderPage } from "@/components/header-page";

interface IEmptyRooms {
  isAdmin: boolean;
  setEditingRoom: Dispatch<SetStateAction<RoomResource | null>>;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
}

function EmptyRooms({ isAdmin, setEditingRoom, setDialogOpen }: IEmptyRooms) {
  return (
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
  );
}

interface IListRooms {
  isAdmin: boolean;
  user: AuthUser | null;
  roomsQuery: UseQueryResult<RoomResource[], Error>;
  setDetailsOpen: Dispatch<SetStateAction<boolean>>;
  setEditingRoom: Dispatch<SetStateAction<RoomResource | null>>;
  setDialogOpen: Dispatch<SetStateAction<boolean>>;
  setDetailsRoom: Dispatch<SetStateAction<RoomResource | null>>;
}

function ListRooms({
  isAdmin,
  user,
  roomsQuery,
  setDetailsOpen,
  setEditingRoom,
  setDialogOpen,
  setDetailsRoom,
}: IListRooms) {
  return roomsQuery.data?.map((item) => (
    <CardRoom
      key={item.id}
      {...item}
      isAdmin={isAdmin}
      currentUserId={user!.id}
      onEdit={(room) => {
        setEditingRoom(room);
        setDialogOpen(true);
      }}
      onOpenDetails={(room) => {
        setDetailsRoom(room);
        setDetailsOpen(true);
      }}
    />
  ));
}

export default function Home() {
  const router = useRouter();
  const { user, status, isAdmin } = useAuth();
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

  const roomsQuery = useQuery({
    queryKey: ["rooms", filters, tab],
    queryFn: () => fetchRooms(filters, tab === "mine"),
    staleTime: 1000 * 60,
    placeholderData: keepPreviousData,
    enabled: status !== "loading",
    refetchOnMount: true,
  });

  useEffect(() => {
    if (status === "unauthenticated" || !user) {
      router.replace("/login");
    }
  }, [status, router, user]);

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
      <HeaderPage />

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
                  onSelect={(d: Date | null) =>
                    setFilters({ date: d ? format(d, "yyyy-MM-dd") : null })
                  }
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>

            <Input
              value={searchInput}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchInput(e.target.value)
              }
              placeholder="Buscar reunião ou participante..."
            />

            <MultiSelect
              options={ROOM_RESOURCES}
              selected={filters.resources}
              onChange={(v: string[]) =>
                setFilters({ resources: v.length ? v : null })
              }
              placeholder="Selecione os recursos..."
            />

            <Input
              type="number"
              min={0}
              value={filters.minParticipants ?? ""}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                  onOpenChange={(next: boolean) => {
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
          onValueChange={(v: "all" | "mine") => setTab(v as "all" | "mine")}
          className="mb-4"
        >
          <TabsList>
            <TabsTrigger value="all">Todas as Salas</TabsTrigger>
            <TabsTrigger value="mine">Minhas Salas</TabsTrigger>
          </TabsList>
        </Tabs>

        <section className="grid min-h-75 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roomsQuery.isError && (
            <div className="col-span-full text-center text-sm text-destructive">
              Erro ao carregar reservas: {(roomsQuery.error as Error).message}
            </div>
          )}
          {!roomsQuery.isError && (roomsQuery.data?.length ?? 0) === 0 ? (
            <EmptyRooms
              isAdmin={isAdmin}
              setDialogOpen={setDialogOpen}
              setEditingRoom={setEditingRoom}
            />
          ) : (
            <ListRooms
              isAdmin={isAdmin}
              user={user}
              roomsQuery={roomsQuery}
              setDetailsOpen={setDetailsOpen}
              setEditingRoom={setEditingRoom}
              setDialogOpen={setDialogOpen}
              setDetailsRoom={setDetailsRoom}
            />
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
