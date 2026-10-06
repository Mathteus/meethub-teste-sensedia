# Changelog

Todas as mudanças relevantes deste projeto serão documentadas neste arquivo.
O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não publicado]

### Adicionado

- **Duração máxima por sala**: o limite fixo de 4 horas foi substituído por `maxDurationMinutes`, configurável por sala (15 min a 24 h). O formulário de criar/editar sala ganhou o campo "Duração máxima desta sala" e o select de duração passa a oferecer apenas opções dentro do limite da sala.
- **Exibição do limite** no dialog de detalhes da sala ("Limite desta sala: X min").
- **Testes**: novos casos no `room.service.spec.ts` para duração abaixo do mínimo, acima do limite padrão, acima do limite por sala, limite inválido, e validação/aumento do limite no `update`.

### Alterado

- `rooms` ganhou a coluna `max_duration_minutes` (`NOT NULL DEFAULT 240`); `serializeRoom`, `createRoomSchema` (refine de coerência) e `updateRoomSchema` foram atualizados.
- Validação no `RoomService` agora usa `validateDuration(durationMinutes, maxDurationMinutes)` com mensagens específicas.

### Corrigido

Correções de infraestrutura feitas durante a implementação acima. **Não fazem parte da funcionalidade da duração máxima** — foram necessárias porque o build e a aplicação estavam quebrados de forma independente dela.

- **`import { randomUUIDv7 } from "bun"` incompatível com o bundler**: o import literal de `bun` não é resolvido pelo webpack (`Cannot find module 'bun'`) nem empacotado corretamente pelo Turbopack (`Failed to load external module pg-<hash>`). Criado `src/backend/utility/uuid.ts` com um gerador de UUID v7 baseado em `crypto.getRandomValues`, usando `Bun.randomUUIDv7` quando disponível. Afetou `schema/accounts.ts`, `schema/rooms.ts`, `entity/account.entity.ts` e `entity/room.ts` — o comportamento de geração de ID permanece idêntico.
- **`textArray` inexistente no Drizzle**: `schema/rooms.ts` importava `textArray`, que não é exportado pela versão instalada do `drizzle-orm`, quebrando qualquer rota que importasse o schema. Substituído por `text("participants").array()`.
- **Schema divergente do banco**: a tabela `rooms` no PostgreSQL tinha `resources` como `jsonb`, enquanto o schema Drizzle declara `varchar[]`. A coluna foi convertida para `varchar(255)[]` e o filtro por recurso no repositório passou a usar `= ANY(resources)` no lugar do operador `jsonb @>`. O `seed.sql` foi atualizado para o novo tipo e passou a popular `max_duration_minutes` com limites variados por sala (60 a 480 min).
- **`database/index.ts`**: exports de `getDb`/`schema` removidos para evitar um erro de resolução do Turbopack; `room.repository.ts` passou a importar `db` e o schema diretamente.
- **Scripts com webpack**: `dev` e `build` passaram a usar `--webpack`, contornando o bug de external module do Turbopack com `pg`/`drizzle-orm` na versão atual do Next 16.
- `room.validators.ts` importava `Recurces` de `../entity/room` (que puxa `bun` para o bundle do browser); agora importa de `../entity/room.types`.
- **Arquivos perdidos restaurados**: 32 arquivos novos (componentes, rotas de API, specs, `seed.ts`, `cypress/`) sumiram do working tree e foram recuperados do commit `71fc5b1`.

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
