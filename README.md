# MeetHub

MeetHub é uma aplicação para gerenciamento de reservas de salas de reunião. Usuários se cadastram e fazem login (JWT em cookie httpOnly), usuários comuns podem visualizar todas as salas, filtrar e participar de reservas, e **cancelar apenas as próprias reservas**; administradores podem criar, editar, excluir reservas e ver todas as salas por responsável.

## Funcionalidades

- Autenticação com signup / signin / signout (JWT + cookie httpOnly), com a `role` resolvida server-side
- Listagem de salas com filtros via query params (`date`, `q`, `resources`, `minParticipants`) e `?mine=true` para "Minhas Salas" (as filtros ficam na URL via `nuqs`)
- Abas "Todas as Salas" e "Minhas Salas"
- Dialog de detalhes da sala com botão **Participar** (`POST /api/rooms/:id/join`)
- Cancelar presença/reserva (ADMIN ou o dono da reserva)
- Dois tipos de conta: `USER` (comum) e `ADMIN`

## Tecnologias

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript**
- **Bun** como runtime e package manager
- **Drizzle ORM** + **PostgreSQL 16** (via Docker Compose)
- **TanStack Query** para fetch/cache no cliente, **nuqs** para estado de filtros na URL
- **zod** para validação de formulários e variáveis de ambiente, **react-hook-form**
- **Tailwind CSS 4** + **shadcn/ui** (base-ui) para a interface
- **Vitest** (testes de lógica/rotas) e **Cypress** (testes de tela)

## Credenciais de teste

Usuários criados pelo `bun run seed` para testar os perfis:

| Perfil | E-mail | Senha | Acesso |
|---|---|---|---|
| ADMIN | `admin@meethub.com` | `@Admin123` | Gerencia todas as salas (criar/editar/excluir) |
| USER | `maria@meethub.com` | `@User1234` | Lista tudo, participa e cancela as próprias reservas |
| USER | `joao@meethub.com` | `@User1234` | Lista tudo, participa e cancela as próprias reservas |

## Como rodar

Pré-requisitos: Bun instalado e Docker.

```bash
# 1. Subir o Postgres
docker compose up -d

# 2. Variáveis de ambiente — configure o .env com:
#    DATABASE_URL, JWT_SECRET, COOKIE_SECRET, SESSION_SECRET, SESSION_SALT, etc.

# 3. Instalar dependências
bun install

# 4. Criar tabelas (drizzle-kit push ou SQL direto) e popular o banco
bunx drizzle-kit push
bun run seed        # usuários: admin@meethub.com / @Admin123, maria / @User1234, joao / @User1234

# 5. Rodar em desenvolvimento (porta 3333)
bun run dev
```

Acesse http://localhost:3333.

## Como funciona (arquitetura)

```
src/
  app/
    api/auth/*        # rotas: signin, signup, signout, me
    api/rooms/*       # rotas: GET (listar/filtrar), POST (criar), PATCH/DELETE/:id, POST/:id/join
    page.tsx          # home com as abas "Todas as Salas"/"Minhas Salas" e filtros
  backend/
    entity/           # Account, Room (entidades de domínio) + room.types.ts (enum Recurces)
    service/          # AuthService, RoomService (regras de negócio, validação de acesso)
    repository/       # acesso ao banco via Drizzle (kysely/drizzle-orm node-postgres)
    database/         # pool pg, schema (accounts, rooms)
    utility/          # jwt, hash (bcrypt via Bun), validators (zod)
  lib/auth/           # session (cookies), auth-provider (contexto React + TanStack Query)
  components/ui/      # shadcn/ui
```

Fluxo de autenticação: o login retorna um JWT guardado em cookie httpOnly (`meethub.session`). Cada request do cliente envia o cookie; o servidor valida o JWT, resolve a conta no banco (`authService.me`) e aplica as regras de acesso (ADMIN vs dono da reserva) no `RoomService`.

## Testes

```bash
bun run test          # Vitest (55 testes: services, rotas, entidades)
bun run cypress:run   # Cypress e2e (requer dev server rodando em localhost:3333)
bun run cypress:open  # modo interativo
```

## Produção (proposta)

```
                HTTPS (domínio)
                     │
        ┌────────────▼─────────────┐
        │  Vercel / Fly.io / VM    │
        │  Next.js (bun build)     │
        │  - SSR + Route Handlers  │
        └────────────┬─────────────┘
                     │ TLS, DATABASE_URL (segredo)
        ┌────────────▼─────────────┐
        │  PostgreSQL gerenciado   │
        │  (Supabase/Neon/RDS)     │
        └──────────────────────────┘

Segredos: JWT_SECRET, COOKIE_SECRET, SESSION_SECRET, SESSION_SALT e DATABASE_URL
  -> injetados via gerenciador de segredos/variáveis de ambiente do provedor
     (nunca commitados; .env apenas local).

Ambientes:
  - development: docker-compose Postgres local + bun run dev (porta 3333)
  - test:        banco descartável/efêmero (docker-compose ou testcontainers),
                 vitest para lógica + cypress contra dev server local
  - production:  build otimizado (bun run build), variáveis de ambiente de
                 produção, cookies Secure, migrations aplicadas no deploy
```

Em produção a aplicação rodaria o build do Next.js atrás de HTTPS (Vercel, Fly.io ou uma VM com Docker), com o Postgres em um serviço gerenciado e os segredos injetados como variáveis de ambiente criptografadas; um job separado aplicaria as migrations antes do deploy. O ambiente de testes usa um banco temporário para os testes de Vitest/Cypress, e o de desenvolvimento roda local com Docker Compose.
