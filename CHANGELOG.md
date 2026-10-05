# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.1.0] - 2026-10-05

### Adicionado

- **Testes automatizados com Vitest**: 55 testes cobrindo `AuthService` (signup/signin/remove de role no JWT), `RoomService` (list/listFiltered/listByCreator/create/update/remove/join), entidades e rotas de API de auth e rooms.
- **Testes E2E com Cypress**: 12 cenários em `cypress/e2e/` cobrindo listagem de salas, filtros com sincronização na URL, estado vazio, abas "Todas as Salas"/"Minhas Salas", botão "Cancelar presença", dialog de detalhes e botão "Participar".
- **Filtros de salas no servidor**: `GET /api/rooms?date=&q=&resources=&minParticipants=` filtra diretamente no PostgreSQL via `roomRepository.findFiltered` (`ILIKE`, `jsonb @>`, `cardinality`).
- **Aba "Minhas Salas"**: `GET /api/rooms?mine=true` retorna só as salas do usuário autenticado; aba "Todas as Salas" lista todas.
- **Participar em sala**: dialog de detalhes ao clicar no card, com botão "Participar" (`POST /api/rooms/:id/join`) e estado "Você já participa".
- **Cancelar presença/reserva**: `RoomService.remove` agora permite ADMIN **ou** o dono da reserva (`createdBy === actorId`); botão de texto "Cancelar presença" (substituiu o ícone de lixeira).
- **Seed**: `seed.sql` (3 usuários — admin/maria/joao — e 5 salas) idempotente com `ON CONFLICT DO NOTHING`, e script `seed.ts` + `bun run seed` para executar via Node/Bun.
- **Visibilidade de senha**: botão de "olho" nos campos de senha das telas de login e registro.
- **Configuração do Vitest**: `vitest.config.ts` com alias `@/`.
- **NuqsAdapter** em `layout.tsx` e `nuqs` para manter os filtros na URL.

### Alterado

- **JWT sem `role`**: o token agora carrega apenas `sub`, `email`, `username`; a `role` é resolvida server-side a cada request (`authService.me(session.sub)`). Rotas de rooms atualizadas para não depender de `session.role`.
- **Home mais moderna e responsiva**: header com `backdrop-blur` e tokens de tema, painel de filtros em `Card` com grid responsivo, cards com hover/sombra, duração como badge.
- **Filtros no TanStack Query**: `queryKey` baseado nos filtros, `keepPreviousData` para não piscar a lista, debounce de 400ms na busca; a busca usa `Input` puro em vez do combobox `SearchAutocomplete`.
- **Filtro de data padrão removido**: sem filtro por padrão; antes a lista vinha vazia porque o padrão filtrava pela data atual e as salas do seed (06/10–09/10) ficavam de fora. O filtro agora é opcional e fica na URL.
- **README** reescrito: apresentação, tecnologias, como rodar, arquitetura e proposta de produção (diagrama + segredos + ambientes).

### Corrigido

- **Erro 500 no signup/signin**: `session.ts` era um arquivo `"use server"` com export de string (`sessionCookieName`), inválido — removido.
- **`room.ts` quebrava o build do browser**: importava `randomUUIDv7` de `bun`; o enum `Recurces` e a interface `IRoom` foram movidos para `room.types.ts` (compartilhado, sem `bun`) e os imports do front ajustados.
- **Esquema e exports do banco**: criado `src/backend/database/schema/rooms.ts`, exportado em `schema/index.ts`; `database/index.ts` passou a exportar `getDb()` e `schema` (o `room.repository.ts` falhava ao importar esses símbolos).
- **Tabela `rooms` e enum `role`** ausentes no Postgres local: criados manualmente no banco (e seed reaplicado).
- **`<button>` dentro de `<button>`** em `create-room.tsx` e `delete-room-dialog.tsx` (aviso do Base UI): corrigido usando o `render` prop do `DialogTrigger`/`AlertDialogTrigger`.
- **Cypress 16 quebrado no Windows**: chalk v5 ESM dentro de `log-symbols`; removidos os `node_modules` aninhados incompatíveis e reinstalado o binário do Cypress.

## [1.0.0] - 2026-10-05

### Adicionado

- Sistema de autenticação de usuários
- Cadastro e gerenciamento de salas
- Agendamento de salas
- Edição e exclusão de agendamentos
- Busca e seleção de salas
- Suporte a recursos das salas
- Interface utilizando shadcn/ui
- Persistência de dados com PostgreSQL e Drizzle ORM
- Validação de variáveis de ambiente
- Estrutura inicial do projeto com Next.js
