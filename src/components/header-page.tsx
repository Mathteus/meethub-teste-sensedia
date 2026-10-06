import {
  Badge,
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  PaletteIcon,
  ShieldIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { RealTimeClock } from "./realtime-clock";
import { useAuth } from "@/lib/auth/auth-provider";
import { useTheme } from "next-themes";

export function HeaderPage() {
  const { user, signout } = useAuth();
  const { setTheme, theme } = useTheme();

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

  return (
    <header className="fixed z-50 flex w-full flex-wrap items-center justify-between gap-4 border-b border-border bg-background/80 px-4 py-4 backdrop-blur md:px-10">
      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
        MeetHub
      </h1>
      <div className="ml-auto mr-2 hidden items-center gap-2 md:flex">
        <Badge variant="secondary" className="gap-1.5">
          {user!.role === "ADMIN" ? (
            <ShieldIcon className="size-3.5" />
          ) : (
            <BadgeCheckIcon className="size-3.5" />
          )}
          <span className="text-xs">
            {user!.role === "ADMIN" ? "Administrador" : "Usuário"}
          </span>
        </Badge>
        <span className="text-sm font-medium text-muted-foreground">
          Olá, {user!.username}
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
                alt={user!.username}
              />
              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
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
  );
}
