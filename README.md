# MeetHub

Aplicação para reserva de salas de reunião. Usuários se cadastram e fazem login (JWT em cookie httpOnly). **Usuários comuns** veem todas as salas, filtram, participam e cancelam apenas as próprias reservas. **Administradores** criam, editam e excluem qualquer reserva.

## Funcionalidades

- Autenticação com signup, signin, signout e `me` — a `role` é resolvida server-side e nunca vai no token
- Duas abas: **Todas as Salas** e **Minhas Salas**
- Filtros com estado na URL (`date`, `q`, `resources`, `minParticipants`), compartilháveis e sobrevividos a refresh
- Dialog de detalhes da sala com botão **Participar** e opção de sair
- Botão **Cancelar presença** (liberado para ADMIN ou para o dono da reserva)
- **Duração máxima por sala** (`maxDurationMinutes`, de 15 min a 24 h) no lugar do limite fixo de 4 h
- **Janela comercial**: reservas só de segunda a sexta, das 08:00 às 20:00, considerando o término
- Seed com 3 usuários e 5 salas para testar

## Tecnologias

- **Next.js 16** (App Router, webpack) + **React 19** + **TypeScript**
- **Bun** como runtime e package manager — **obrigatório**: a aplicação usa `Bun.password` (bcrypt) e `Bun.jwt`, que não existem no Node
- **Drizzle ORM** + **PostgreSQL 16**
- **TanStack Query** para dados no cliente e **nuqs** para filtros na URL
- **zod** + **react-hook-form** para validação
- **Tailwind CSS 4** + **shadcn/ui** (Base UI)
- **Vitest** (lógica e rotas) e **Cypress** (tela)

## Credenciais de teste

Criadas por `bun run seed`:

| Perfil | E-mail | Senha | Acesso |
|---|---|---|---|
| ADMIN | `admin@meethub.com` | `@Admin123` | Gerencia todas as salas |
| USER | `maria@meethub.com` | `@User1234` | Lista tudo, participa e cancela as próprias |
| USER | `joao@meethub.com` | `@User1234` | Lista tudo, participa e cancela as próprias |

## Como rodar

Pré-requisitos: Bun instalado e Docker rodando.

```bash
# 1. Banco
docker compose up -d

# 2. Variáveis de ambiente (.env)
#    DATABASE_URL, JWT_SECRET, COOKIE_SECRET, SESSION_SECRET, SESSION_SALT
#    PORT, HOST, ENVIRONMENT, APPLICATION_NAME

# 3. Dependências
bun install

# 4. Schema e dados
bunx drizzle-kit push
bun run seed

# 5. Desenvolvimento
bun run dev
```

Acesse http://localhost:3333.

## Arquitetura

```
src/
  app/
    api/auth/*        signin, signup, signout, me
    api/rooms/*       GET (listar/filtrar), POST, PATCH/DELETE /:id, POST /:id/join
    api/health/       health check para load balancer
    api/database/     verificação de conexão com o banco
    page.tsx          home com abas, filtros na URL e dialog de detalhes
  backend/
    entity/           Account, Room + room.types.ts (compartilhado, sem dependência de runtime)
    service/          AuthService e RoomService (regras de negócio e acesso)
    repository/       acesso ao banco via Drizzle
    database/         pool do PostgreSQL e schema (accounts, rooms)
    utility/          jwt, hash (bcrypt via Bun), validators (zod), schedule, uuid
  lib/auth/           session (cookies) e auth-provider (contexto + TanStack Query)
  components/         componentes de tela e ui/ (shadcn)
```

**Fluxo de autenticação.** O login grava um JWT em cookie httpOnly (`meethub.session`). Cada requisição envia o cookie; o servidor valida o token, busca a conta no banco (`authService.me`) e decide o acesso no service. Por isso remover a `role` do token não quebrou a autorização — ela é sempre reavaliada no servidor.

**Validação em três camadas.** As regras de duração e de agenda são checadas no formulário (resposta imediata), no `zod` (400 com campo específico) e no service (fonte autoritativa, imutável pelo cliente).

## Testes

```bash
bun run seed                            # os testes E2E dependem dos dados do seed
bun run test                            # Vitest: 96 testes em 13 arquivos
node node_modules/cypress/bin/cypress run   # Cypress: 20 cenários (exige o dev server)
bun run cypress:open                    # Cypress interativo
```

O `cypress.config.ts` restaura o seed antes de cada execução, porque o cenário de "participar" altera os participantes no banco e tornaria as execuções seguintes não reproduzíveis.

---

## Produção na AWS

### Onde roda

A aplicação sobe como **containers ECS Fargate** (Linux, runtime Bun), com imagem construída em ECR. Escolhi ECS em vez de Vercel porque a aplicação precisa de runtime Bun e de acesso direto ao PostgreSQL com pooling; serverless também tenderia a estourar o limite de conexões do banco. A frente dela ficam um **CloudFront** (cache dos estáticos) e um **ALB** com WAF, e as tasks são distribuídas em **duas zonas de disponibilidade**.

O banco é um **RDS PostgreSQL Multi-AZ**, com acesso restrito ao security group do ECS. Não há porta pública: só o ALB aceita tráfego da internet.

### Diagrama

```
                         Usuário (navegador)
                                  │  HTTPS
                                  ▼
                    ┌──────────────────────────┐
                    │  CloudFront (CDN)         │  cache de /_next/static
                    └────────────┬─────────────┘
                                 ▼
                    ┌──────────────────────────┐
                    │  WAF + ALB                │  rate limit, HTTPS
                    │  health: /api/health     │
                    └────────────┬─────────────┘
                                 ▼
        ┌────────────────────────────────────────────┐
        │  ECS Fargate — tasks em 2 AZs              │
        │  • Next.js (bun run start)                  │
        │  • /api/* → Bun.password + drizzle-orm      │
        └───────┬──────────────────────────┬─────────┘
                │                          │
                ▼                          ▼
   ┌────────────────────────┐  ┌───────────────────────────┐
   │ Secrets Manager / SSM  │  │ RDS PostgreSQL Multi-AZ    │
   │ JWT_SECRET             │  │ SG somente do ECS         │
   │ COOKIE_SECRET          │  │ backup automático +       │
   │ SESSION_SECRET/SALT    │  │ snapshot diário           │
   │ DATABASE_URL           │  │                           │
   └────────────────────────┘  └───────────────────────────┘
                │
                ▼
   ┌────────────────────────┐
   │ CloudWatch             │  logs, métricas, alarmas
   └────────────────────────┘

   GitHub Actions ──▶ ECR ──▶ CodeBuild (imagem) ──▶ ECS (deploy)
                                   └──▶ CodeBuild (migrations) ──▶ RDS
```

### Ambiente de teste

Roda **por pull request**, com recursos efêmeros e custo zero quando o job termina:

- **Banco descartável**: RDS menor, ou um PostgreSQL em container no runner, destruído no fim do job. O ideal é subir um RDS efêmero com `DeletionPolicy: Delete` e snapshot desligado.
- **Sem secrets de verdade**: o job injeta valores fictícios (`JWT_SECRET` com 32+ caracteres gerado na hora). Nenhum segredo de produção é acessível a PRs de forks — em GitHub, use `pull_request_target` com cuidado ou GITHUB_TOKEN sem escopo de leitura de secrets.
- **Etapas**: `bun install` → `bun run test` → `docker compose up -d` + `bun run seed` → `cypress run` contra o app no container.

### Ambiente de produção

```
main ──▶ GitHub Actions ──▶ ECR ──▶ CodeBuild ──▶ ECS (rolling)
                                  └──▶ CodeBuild (migrations) ──▶ RDS
                                    └──▶ smoke test ──▶ ALB
```

- **Zero downtime**: o ECS faz rolling deploy; o ALB só troca de target group quando o health check (`/api/health`) passa.
- **Migrations antes do código novo**: um job separado roda `drizzle-kit migrate` contra o RDS antes do deploy da aplicação. Assim, versão antiga e nova do app nunca correm contra um schema incompatível.
- **Rollback**: se o health check falhar, o ECS volta para a task definition anterior, e as migrations são sempre aditivo — nada de `DROP COLUMN` no mesmo deploy que a coluna começa a ser usada.

### Segredos

Todos vivem em **Secrets Manager** (ou SSM Parameter Store `SecureString`) e chegam ao container como **variáveis de ambiente** injetadas na task definition:

| Segredo | Para quê |
|---|---|
| `JWT_SECRET` | assina o JWT da sessão |
| `COOKIE_SECRET` | criptografia do cookie |
| `SESSION_SECRET` / `SESSION_SALT` | derivação da sessão |
| `DATABASE_URL` | host, porta, usuário e senha do RDS |

Regras: nada disso no Git; rotação do `JWT_SECRET` invalida todas as sessões (comportamento aceitável, planejado); acesso aos secrets restrito ao papel de deploy, não a-developer humano; RDS com `iam authentication` ou senha gerenciada pelo Secrets Manager, trocada por rotação automática.

### Ferramentas

| Ferramenta | Para quê |
|---|---|
| **Terraform** ou **AWS CDK** | IaC versionada; preferível a mudanças manuais no console |
| **GitHub Actions** | CI dos PRs e CD no `main` |
| **Amazon ECR** | registry das imagens |
| **AWS CodeBuild** | build da imagem e execução das migrations |
| **Amazon ECS Fargate** | execução dos containers, com auto scaling por CPU/RAM |
| **Amazon RDS** | PostgreSQL Multi-AZ |
| **Secrets Manager** | segredos |
| **CloudWatch** | logs, métricas, alarmas de 5xx e de latência |
| **AWS WAF** | proteção de borda e rate limiting |

### Primeiro deploy, em ordem

1. `terraform apply` do RDS (Multi-AZ, backup diário, sem acesso público) e dos security groups.
2. Criar os segredos no Secrets Manager.
3. `terraform apply` do ALB, ECS, ECR e das task definitions.
4. Rodar as migrations a partir de uma task one-off do ECS.
5. Registrar o domínio no Route 53 e apontar para o ALB.
6. Subir o smoke test pós-deploy e validar `/api/health` e `/api/database`.

### Riscos conhecidos antes de ir para produção

- **Runtime Bun é obrigatório.** `src/backend/utility/hash.ts` lança erro se `Bun.password` não existir, e `password.ts` tem um fallback com SHA-256 que **não serve para senha**. Se a imagem deixar de rodar em Bun, a autenticação quebra ou fica insegura — vale um health check que falhe quando o runtime não for Bun.
- **Fuso horário das regras de agenda.** `schedule.ts` usa os componentes locais da data, ou seja, o fuso do container. Mantenha o container em UTC ou defina `TZ` explicitamente para que "08:00" signifique o mesmo para o servidor e para o usuário.
- **Limite de conexões.** Cada task do ECS abre um pool. Com auto scaling, o número de conexões cresce junto. Use `max` no pool do Drizzle e/ou o **RDS Proxy** para amortecer.