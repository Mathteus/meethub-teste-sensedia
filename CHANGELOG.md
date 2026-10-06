# Changelog

Todas as mudanças relevantes deste projeto.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e
o versionamento é [SemVer](https://semver.org/lang/pt-BR/). As datas são
`AAAA-MM-DD`.

---

## Resumo do estado atual

O MeetHub é uma aplicação de reserva de salas com dois perfis de acesso:

| Perfil | O que pode fazer |
|---|---|
| `USER` | Ver todas as salas, filtrar, participar e cancelar **apenas as próprias** reservas |
| `ADMIN` | Tudo do `USER` e também criar, editar e excluir qualquer reserva |

Regras de negócio em vigor:

- **Duração máxima por sala** — cada sala define seu próprio teto (`maxDurationMinutes`, de 15 min a 24 h). Substituiu o limite fixo de 4 h.
- **Janela comercial** — reservas só existem de **segunda a sexta, das 08:00 às 20:00**, considerando o horário de término.

Cobertura de testes: **96 testes Vitest** (13 arquivos) e **20 cenários Cypress** (5 specs).

---

## [1.0.1] - 2026-10-06

Duas features de agenda que se cruzam no mesmo código: limite de duração por
sala e restrição de dias úteis/horário comercial. A seção
[Conflito entre SALA-6 e SALA-5](#conflito-entre-sala-6-e-sala-5) explica o que
acontece quando elas são desenvolvidas em paralelo e como as duas ficam convivendo.

### Adicionado

#### Duração máxima por sala (SALA-6)

- Campo `maxDurationMinutes` na tabela `rooms` (`max_duration_minutes`, `NOT NULL DEFAULT 240`) e no schema Drizzle.
- Limite configurável por sala entre **15 min e 24 h**, no lugar do `.max(240)` fixo.
- Campo **"Duração máxima desta sala"** no formulário de criar/editar.
- O select de duração passa a oferecer **apenas opções dentro do limite** da sala; ao reduzir o limite, a duração é ajustada automaticamente.
- Badge **"Xh máx"** em cada card da listagem.
- Exibição do limite no dialog de detalhes ("Limite desta sala: X min").
- Mensagens específicas: "Duração mínima é de 15 minutos", "A duração máxima da sala deve ser entre 15 min e 24 horas", "Duração excede o limite desta sala (máximo de X minutos)".

#### Dias úteis e horário comercial (SALA-5)

- Novo utilitário `src/backend/utility/schedule.ts` com `isBusinessDay`, `minutesOfDay`, `endOfReservation`, `checkSchedule`, `assertSchedule`, `scheduleViolationMessage`, `nextBusinessDay` e as constantes `BUSINESS_HOUR_START` (8) / `BUSINESS_HOUR_END` (20).
- `RoomService.create` e `RoomService.update` chamam `assertSchedule` — fonte autoritativa, sempre server-side.
- `createRoomSchema` ganhou um `refine` que devolve **400** com erro em `startAt`.
- `create-room.tsx` valida antes de enviar, para dar retorno imediato na tela.
- O formulário passou a sugerir o **próximo dia útil às 09:00** como data inicial. Antes era "amanhã", que cairia em fim de semana numa sexta — a própria regra rejeitaria.
- Mensagens: "Reservas só podem ser feitas de segunda a sexta (dias úteis)", "Reservas só podem começar a partir das 08:00" e "A reserva precisa terminar até as 20:00".

#### Testes

- `src/backend/utility/schedule.spec.ts` — 15 casos do utilitário (dias úteis, sábado/domingo, limites exatos de 08:00 e de término às 20:00, violações, prioridade da regra de dia, `nextBusinessDay`).
- `src/backend/service/room.service.spec.ts` — 8 casos de agenda em `create` e `update`, e 5 casos de duração máxima.
- `src/app/api/rooms/schedule.route.spec.ts` — 4 casos de **400** na API.
- `cypress/e2e/schedule.cy.ts` — 4 cenários de tela (bloqueia sábado, bloqueia término após 20h, bloqueia início antes de 8h, permite reserva válida).
- `cypress/e2e/max-duration.cy.ts` — 4 cenários da duração máxima por sala.

### Alterado

- `seed.sql` passou a popular `max_duration_minutes` com limites variados por sala (60, 120, 240 e 480 min), todos dentro da janela comercial.
- `room.service.spec.ts` deixou de usar `startAt: Date.now() + 1h` (que passa a cair fora do expediente em parte do dia) e passou a usar um helper determinístico `nextBusinessSlot()`.
- `create-room.tsx`: rótulo do botão principal de "Criar sala" para **"Criar reserva"**, alinhado ao vocabulário das demais telas.

### Corrigido

Correções de infraestrutura necessárias para o build e a aplicação funcionarem. **São independentes das features acima**.

- **`import { randomUUIDv7 } from "bun"` incompatível com o bundler**: o import literal de `bun` não é resolvido pelo webpack (`Cannot find module 'bun'`) nem empacotado corretamente pelo Turbopack (`Failed to load external module pg-<hash>`). Criado `src/backend/utility/uuid.ts` com UUID v7 baseado em `crypto.getRandomValues`, usando `Bun.randomUUIDv7` quando disponível. A geração de IDs continua idêntica.
- **`textArray` inexistente no Drizzle**: `schema/rooms.ts` importava `textArray`, que a versão instalada do `drizzle-orm` não exporta, quebrando qualquer rota que importasse o schema. Substituído por `text("participants").array()`.
- **Schema divergente do banco**: a tabela `rooms` no PostgreSQL tinha `resources` como `jsonb`, enquanto o schema Drizzle declara `varchar[]`. A coluna foi convertida para `varchar(255)[]` e o filtro por recurso passou a usar `= ANY(resources)` no lugar do operador `jsonb @>`.
- **Componentes do shadcn incompatíveis**: a atualização de `ui/*` trazia o import quebrado `@/backend/utility/components/ui/button` e uma API de `Select` diferente da usada por `create-room.tsx`. Os componentes foram mantidos na versão compatível.
- **`<button>` dentro de `<button>`** em `create-room.tsx` e `delete-room-dialog.tsx`, via `render` prop do Base UI.
- **Popups do Select não desmontam ao fechar**: o DOM mantinha as opções dos selects fechados, deixando os seletores de teste ambíguos. Resolvido escopando os seletores ao popup aberto (`[data-slot="select-content"][data-open]`) em vez de alterar o componente compartilhado.
- **`package.json` incompleto**: os scripts `cypress:*` existiam mas o Cypress não estava declarado em dependências, e o script `seed` havia se perdido. Um `bun install` limpo quebraria o E2E.
- **Cypress no Windows**: `chalk` 5 (ESM) dentro de `log-symbols` quebrava o CLI do Cypress; resolvido removendo os `node_modules` aninhados e instalando o binário.

---

### Conflito entre SALA-6 e SALA-5

As duas features mexem nas mesmas linhas, porque uma valida **dentro** do que a outra criou. Se forem desenvolvidas em paralelo a partir da `main`, o Git marca conflito — e isso é esperado, não um problema.

**Onde as linhas se cruzam**

| Arquivo | SALA-6 escreve | SALA-5 escreve logo após |
|---|---|---|
| `room.validators.ts` | `.refine(durationMinutes <= maxDurationMinutes)` | `.refine(checkSchedule(...))` |
| `room.service.ts` | `validateDuration(...)` | `assertSchedule(...)` |
| `create-room.tsx` | `if (duration > maxDuration) return …` | `const scheduleError = scheduleErrorFor(...)` |
| `room.service.spec.ts` | fixture com `maxDurationMinutes: 240` | fixture com `startAt` em dia útil |

Em todos os casos a SALA-5 se apoia na linha que a SALA-6 acabou de criar. O Git não sabe qual ordem faz sentido semanticamente, então pergunta.

**Como resolver, mantendo as duas**

1. Abra o arquivo com conflito e mantenha **as duas chamadas**, na ordem: duração primeiro, agenda depois. A ordem importa — a mensagem de erro mais específica vem primeiro, e nenhuma regra short-circuita a outra.
2. No `room.validators.ts`, preserve a cadeia completa:
   ```ts
   export const createRoomSchema = z
     .object(baseRoomFields)
     .refine((d) => d.durationMinutes <= d.maxDurationMinutes, { … })   // SALA-6
     .refine((d) => checkSchedule(new Date(d.startAt), d.durationMinutes) === null, { … }); // SALA-5
   ```
3. No `create-room.tsx`, a validação do formulário também fica em sequência: `duration > maxDuration` e depois `scheduleErrorFor(startDate, duration)`.
4. Na fixture de teste, junte as duas intenções — dia útil dentro do expediente **e** `maxDurationMinutes`. Foi o que motivou o helper `nextBusinessSlot()`.
5. No `seed.sql`, mantenha a coluna `max_duration_minutes` no `INSERT` e ajuste as datas/horários para dias úteis dentro de 08:00–20:00.

**Como conferir que deu certo**

```bash
bun run seed
bun run test                 # 96 testes
node node_modules/cypress/bin/cypress run
```

Dois cenários que vale a pena ter em mente ao revisar o PR:
- uma reserva de 6 h numa sala com limite de 8 h, numa quarta às 10:00, deve ser **aceita** (as duas regras satisfeitas);
- a mesma reserva num sábado, ou numa quarta das 19:00 às 21:00, deve ser **recusada** com a mensagem da agenda.

**Como evitar o conflito**

Implementar a SALA-5 **sobre** a branch que já contém a SALA-6. As regras se encadeiam, não competem; a ordem natural é duração máxima e depois agenda.

---

## [1.1.0] - 2026-10-05

### Adicionado

- **Autenticação**: signup, signin, signout e `GET /api/auth/me`, com JWT em cookie httpOnly.
- **Perfis** `USER` e `ADMIN`, com `Role` resolvida server-side.
- **Salas**: CRUD completo com filtros de conflito de horário, validação de duração e de data no passado.
- **Filtros no servidor**: `GET /api/rooms?date=&q=&resources=&minParticipants=` filtra direto no PostgreSQL via `roomRepository.findFiltered` (`ILIKE`, `cardinality`).
- **Aba "Minhas Salas"**: `GET /api/rooms?mine=true` devolve só as reservas do usuário autenticado, ao lado da aba "Todas as Salas".
- **Participar em sala**: dialog de detalhes ao clicar no card, com botão "Participar" (`POST /api/rooms/:id/join`) e estado "Você já participa".
- **Cancelar presença**: `RoomService.remove` permite ADMIN **ou** o dono da reserva (`createdBy === actorId`); o ícone de lixeira foi trocado pelo texto "Cancelar presença".
- **Filtros na URL**: `nuqs` + `useQueryStates`, com `NuqsAdapter` no layout — os filtros sobrevivem a refresh e podem ser compartilhados.
- **Seed**: `seed.sql` idempotente (`ON CONFLICT DO NOTHING`) com 3 usuários e 5 salas, e `seed.ts` + `bun run seed` para executá-lo.
- **Visibilidade de senha**: botão de "olho" nos campos de senha de login e registro.
- **Testes**: 55 testes Vitest e 12 cenários Cypress.

### Alterado

- **JWT sem `role`**: o token carrega apenas `sub`, `email` e `username`; a role é resolvida a cada request via `authService.me(session.sub)`.
- **Interface mais moderna e responsiva**: header com `backdrop-blur` e tokens de tema, painel de filtros em `Card` com grid responsivo, cards com hover/sombra.
- **Filtros no TanStack Query**: `queryKey` derivado dos filtros, `keepPreviousData` para não piscar a lista e debounce de 400 ms na busca.
- **Busca**: trocada do combobox `SearchAutocomplete` por `Input` de texto livre.
- **Filtro de data**: deixou de ter valor padrão. Antes a lista vinha vazia, porque o padrão era a data atual e as salas do seed ficam em 06/10–09/10.
- **README** reescrito: apresentação, tecnologias, como rodar, arquitetura, credenciais de teste e proposta de produção.

### Corrigido

- **Erro 500 em signup/signin**: `session.ts` era um arquivo `"use server"` que exportava uma constante string (`sessionCookieName`) — export inválido nesse tipo de arquivo, que quebrava o import de toda a rota.
- **`room.ts` quebrava o bundle do browser**: importava `randomUUIDv7` de `bun` e era alcançado pelo front. O enum `Recurces` e a interface `IRoom` foram movidos para `room.types.ts`, compartilhado e sem dependência de runtime.
- **Schema do banco**: criado `src/backend/database/schema/rooms.ts` e exportado em `schema/index.ts`; `rooms` e o enum `role` não existiam no PostgreSQL local.
- **Cypress 16 no Windows**: incompatibilidade de `chalk`/`log-symbols` e ausência do binário.
- **32 arquivos novos** que sumiram do working tree foram recuperados do commit `71fc5b1`.

---

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

---

## Dívidas técnicas conhecidas

Registradas para não se perderem. Nenhuma bloqueia o uso:

- **Popups do `Select` permanecem montados ao fechar.** `src/components/ui/select.tsx` é um wrapper do Base UI; as opções ficam no DOM, o que é um problema real de acessibilidade e torna seletores de teste ambíguos. Hoje contornado nos specs.
- **Fuso horário das regras de agenda.** `schedule.ts` usa os componentes locais da data, ou seja, o fuso do servidor. Com app e banco em fusos diferentes, "08:00" pode divergir do que o usuário vê.
- **`room.ts` ainda reexporta o enum.** `src/backend/entity/room.ts` continua exportando `Recurces` por re-export, o que abre caminho para alguém importar a entidade (e o `bun`) no bundle do browser. O certo é passar a importar sempre de `room.types.ts`.
- **Migrations.** As alterações de schema foram aplicadas manualmente no PostgreSQL local (`drizzle-kit push` falhava por ler o diretório de schema em duplicidade). Falta um fluxo de migrations versionado.