# Fintech Expenses Challenge

Plataforma web de gestão de despesas construída com **NestJS + React + PostgreSQL**, com foco em isolamento multi-usuário, agregações no banco e uma API documentada.

| Camada | Stack | Local |
|--------|-------|-------|
| Frontend | React 19 + Vite + TypeScript + MUI | `http://localhost:5173` |
| Backend | NestJS 12 + TypeORM + Passport/JWT | `http://localhost:3000` (docs em `/docs`) |
| Banco | PostgreSQL 16 (Docker Compose) | `localhost:5432` |

**Deploy**: frontend na Vercel, backend + PostgreSQL na Railway (URLs preenchidas após o deploy).

---

## Funcionalidades

- Registro e login com JWT (token válido por 24h)
- Dashboard com saldo, totais do período e top 3 categorias por saída
- CRUD de categorias, isolado por usuário
- CRUD de transações com filtros (tipo, categoria, intervalo de datas) e paginação
- Validação em duas camadas: Zod no cliente, class-validator no servidor
- Respostas e erros padronizados em toda a API
- Documentação Swagger interativa com autenticação Bearer
- TypeScript strict mode nos dois projetos
- 49 testes automatizados no backend

---

## Arquitetura

```
Browser
  │
  │  React 19 SPA (Vite)
  │  ├── React Query  → estado do servidor (categorias, transações, dashboard)
  │  ├── Context API  → sessão de autenticação + toasts
  │  └── Axios        → interceptors anexam o JWT e tratam 401
  │
  ▼  HTTPS / JSON
NestJS API
  ├── ValidationPipe          → valida DTOs (whitelist + forbidNonWhitelisted)
  ├── JwtAuthGuard            → resolve o usuário a partir do Bearer token
  ├── TransformInterceptor    → envelopa a resposta em { data } / { data, meta }
  ├── GlobalExceptionFilter   → { statusCode, message, timestamp, path }
  └── Módulos: auth, users, categories, transactions, dashboard
  │
  ▼  TypeORM (queries parametrizadas)
PostgreSQL 16
  └── users → categories → transactions (todas as queries filtram por userId)
```

---

## Decisões arquiteturais

### 1. React Query para estado do servidor, Context para sessão

São dois tipos de estado diferentes e a divisão evita um gerenciador global:

- **Estado do servidor** (categorias, transações, dashboard) vive no backend, pode ficar obsoleto e é pedido por vários componentes. React Query resolve cache, deduplicação de requisições em voo, estados de `isLoading`/`error` e invalidação após mutações — em `src/hooks/`, criar uma transação invalida a lista *e* o dashboard.
- **Estado do cliente** (usuário logado, toasts) é pequeno, read-mostly e não vem de um fetch. Um Context com `localStorage` basta.

Redux/Zustand exigiriam actions, reducers e sincronização manual com a API para resolver um problema que a camada de cache já resolve. Context sozinho não faz invalidação nem deduplicação e re-renderiza a árvore inteira a cada mudança.

### 2. Sessão restaurada de forma síncrona

O usuário é lido do `localStorage` no *inicializador* do `useState`, não em um `useEffect`. Com o efeito, a primeira renderização tinha `user === null`, e o `ProtectedRoute` redirecionava para `/login` antes da restauração acontecer — a sessão "sumia" a cada refresh. Ver `frontend/src/context/AuthContext.tsx`.

### 3. Cache limpo no logout e no login

`logout()` chama `queryClient.clear()`, descartando todas as queries em cache (transações, categorias, dashboard) em vez de listar chaves que sairiam do lugar conforme novos hooks aparecem. `login()` e `register()` também limpam antes de gravar o novo token, para o caso de trocar de conta sem recarregar a página. Sem isso, o próximo usuário veria por um instante os dados do anterior.

### 4. Erros da API traduzidos em uma camada só

`frontend/src/lib/errors.ts` extrai a mensagem real do corpo da resposta — sem ele a UI mostrava `"Request failed with status code 400"`, a mensagem do próprio Axios. O helper trata as duas formas que o backend produz (`message` string vindo de uma `HttpException` e `message` array vindo da validação de DTO) e identifica o caso de e-mail duplicado, que a tela de registro exibe como erro no campo de e-mail junto de um atalho para o login.

### 5. Agregações do dashboard em SQL

Saldo, totais por período e top 3 categorias são calculados com `SUM`/`GROUP BY`/`CASE WHEN` no PostgreSQL, não em JavaScript. Trafega menos dado pela rede, aproveita os índices e mantém a regra de negócio junto dos dados. Detalhe das três queries em [`backend/README.md`](backend/README.md).

O **saldo é all-time** e ignora o filtro de datas de propósito; apenas os totais do período e o top de categorias respondem a `startDate`/`endDate`.

### 6. Isolamento multi-usuário retorna 404, não 403

Toda query carrega o `userId` do token no `WHERE`. Acessar o recurso de outro usuário devolve **404**, não 403: um 403 confirmaria que aquele ID existe.

```typescript
return this.repo.findOne({
  where: { id: categoryId, userId }, // as duas condições, sempre
});
// dono diferente → null → NotFoundException (404)
```

### 7. Envelope de resposta consistente

Um interceptor global envelopa todo sucesso em `{ data }` (listas paginadas ganham `meta`) e um filtro global normaliza todo erro em `{ statusCode, message, timestamp, path }`. O cliente tem um formato só para tratar, em vez de um por rota.

### 8. MUI em vez de CSS utilitário

A UI usa **MUI v9** com um tema próprio em `frontend/src/theme.ts` (paleta âmbar, `borderRadius` 10, tipografia Inter). Componentes acessíveis prontos — diálogos, campos com estado de erro, tabelas — custam menos tempo que reconstruí-los, e o tema central mantém a identidade visual consistente sem classes utilitárias espalhadas pelo JSX.

### 9. CORS por lista, com localhost liberado fora de produção

`FRONTEND_URL` aceita uma lista separada por vírgulas (produção + staging, por exemplo). Fora de produção, qualquer porta de `localhost`/`127.0.0.1` é aceita, porque o Vite muda de porta quando a 5173 está ocupada. Origem bloqueada é registrada em log e respondida sem os headers de CORS, em vez de virar um 500. Ver `backend/src/common/config/cors.config.ts`.

### 10. Migrations versionadas, `synchronize` desligado

O schema evolui por migrations do TypeORM (`backend/src/database/migrations/`), nunca por `synchronize: true`. O mesmo caminho roda em desenvolvimento e em produção.

---

## Estrutura de pastas

```
fintech-expenses-challenge/
├── backend/
│   ├── src/
│   │   ├── auth/                  # registro, login, JWT
│   │   │   ├── dtos/              # login, register, auth-response
│   │   │   ├── guards/            # JwtAuthGuard
│   │   │   ├── strategies/        # passport-jwt
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.service.spec.ts
│   │   ├── users/                 # perfil do usuário autenticado
│   │   │   ├── dtos/ entities/
│   │   │   └── users.{controller,service,module}.ts
│   │   ├── categories/            # CRUD com escopo por usuário
│   │   │   ├── dtos/ entities/
│   │   │   └── categories.{controller,service,module}.ts
│   │   ├── transactions/          # CRUD + filtros + paginação
│   │   │   ├── dtos/ entities/
│   │   │   └── transactions.{controller,service,module}.ts
│   │   ├── dashboard/             # agregações SQL (somente leitura)
│   │   │   ├── dtos/
│   │   │   └── dashboard.{controller,service,module}.ts
│   │   ├── common/
│   │   │   ├── config/cors.config.ts
│   │   │   ├── decorators/current-user.decorator.ts
│   │   │   ├── dtos/error-response.dto.ts
│   │   │   ├── filters/http-exception.filter.ts
│   │   │   └── interceptors/transform-response.interceptor.ts
│   │   ├── database/
│   │   │   ├── migrations/        # 1000000000000-InitialSchema.ts
│   │   │   ├── data-source.ts
│   │   │   ├── typeorm.config.ts  # datasource da CLI do TypeORM
│   │   │   └── seed.ts            # usuário demo + 5 categorias + 14 transações
│   │   ├── app.controller.ts      # health check em GET /
│   │   ├── app.module.ts
│   │   └── main.ts                # pipes, filtros, helmet, CORS, Swagger
│   ├── test/app.e2e-spec.ts
│   ├── railway.json               # builder nixpacks + start command
│   ├── vitest.config.ts / vitest.config.e2e.ts
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── api/                   # auth, categories, transactions, dashboard
│   │   ├── components/            # Layout, listas, formulários, filtros, toasts
│   │   ├── context/               # AuthContext, ToastContext
│   │   ├── hooks/                 # useCategories, useTransactions, useDashboard
│   │   ├── lib/
│   │   │   ├── client.ts          # instância Axios + interceptors
│   │   │   ├── errors.ts          # mensagens de erro da API
│   │   │   ├── queryClient.ts     # defaults do React Query
│   │   │   └── router.tsx         # rotas + ProtectedRoute
│   │   ├── pages/                 # Dashboard, Transactions, Categories, Login, Register, NotFound
│   │   ├── types/                 # interfaces espelhando os DTOs do backend
│   │   ├── theme.ts               # tema MUI
│   │   ├── App.tsx                # providers + RouterProvider
│   │   └── main.tsx
│   ├── vercel.json                # build, output e rewrite de SPA
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
│
├── docker-compose.yml             # PostgreSQL 16 para desenvolvimento
├── .gitignore
└── README.md                      # este arquivo
```

---

## Pré-requisitos

- **Node.js 18+** e npm
- **Docker** e Docker Compose
- **Git**

## Executando localmente

### 1. Banco de dados

```bash
git clone <repo-url>
cd fintech-expenses-challenge
docker-compose up -d
```

Sobe o PostgreSQL 16 em `localhost:5432` (`postgres` / `postgres`, database `fintech_expenses`).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env          # os padrões já servem para desenvolvimento

npm run typeorm:migration:run # cria as tabelas
npm run seed                  # usuário demo + dados de exemplo
npm run dev
```

API em `http://localhost:3000`, Swagger em `http://localhost:3000/docs`.

### 3. Frontend

```bash
cd ../frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000
npm run dev
```

Aplicação em `http://localhost:5173`.

### Credenciais de demonstração

```
Email: demo@example.com
Senha: password123
```

Criado por `npm run seed`, com 5 categorias e 14 transações espalhadas em datas diferentes, para o dashboard abrir com dados reais.

---

## Variáveis de ambiente

### backend/.env

| Variável | Padrão local | Descrição |
|----------|--------------|-----------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/fintech_expenses` | Connection string completa (usada em produção) |
| `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` | `localhost` / `5432` / `postgres` / `postgres` / `fintech_expenses` | Alternativa por campos |
| `JWT_SECRET` | — | **Obrigatório em produção**; 32+ caracteres |
| `NODE_ENV` | `development` | Em `production` o CORS deixa de liberar localhost |
| `PORT` | `3000` | Porta HTTP |
| `FRONTEND_URL` | `http://localhost:5173` | Origens de CORS, separadas por vírgula |

### frontend/.env

| Variável | Padrão local | Descrição |
|----------|--------------|-----------|
| `VITE_API_URL` | `http://localhost:3000` | URL base da API |

---

## API

Todas as rotas exigem `Authorization: Bearer <token>`, exceto `GET /`, `POST /auth/register` e `POST /auth/login`.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Health check |
| `POST` | `/auth/register` | Cria conta e retorna token |
| `POST` | `/auth/login` | Autentica e retorna token |
| `GET` | `/users/me` | Perfil do usuário autenticado |
| `GET` `POST` | `/categories` | Lista / cria categorias |
| `GET` `PATCH` `DELETE` | `/categories/:id` | Detalhe / atualiza / remove |
| `GET` `POST` | `/transactions` | Lista (filtros + paginação) / cria |
| `GET` `PATCH` `DELETE` | `/transactions/:id` | Detalhe / atualiza / remove |
| `GET` | `/dashboard` | Saldo, totais do período e top 3 categorias |

Filtros de `GET /transactions`: `type`, `categoryId`, `startDate`, `endDate`, `page`, `limit`.
Filtros de `GET /dashboard`: `startDate`, `endDate`.

---

## Testes

```bash
cd backend
npm run test        # 49 testes unitários em 7 arquivos
npm run test:e2e    # testes end-to-end
npm run test:cov    # com cobertura
npm run lint
```

Cobrem autenticação, isolamento entre usuários, composição de filtros com paginação, matemática das agregações do dashboard e a política de CORS. Detalhe por módulo em [`backend/README.md`](backend/README.md).

O frontend valida tipos e build com:

```bash
cd frontend
npm run build   # tsc --noEmit && vite build
npm run lint
```

---

## Deploy

### Frontend → Vercel

1. Importe o repositório e defina `frontend/` como root directory.
2. Configure `VITE_API_URL` com a URL pública do backend.
3. Deploy. O `vercel.json` já traz o build, o output `dist/` e o rewrite de SPA (toda rota serve `index.html`, necessário para o React Router).

### Backend → Railway

1. Crie o projeto e adicione um serviço **PostgreSQL**.
2. Adicione o serviço Node apontando para `backend/`. O `railway.json` define o builder nixpacks e `npm run prod` como start command.
3. Configure `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL` (a URL da Vercel) e `NODE_ENV=production`.
4. Adicione um pre-deploy hook com `npm run typeorm:migration:run`.
5. Opcionalmente rode `npm run seed` uma vez pelo console.

### Smoke test pós-deploy

1. A URL da Vercel carrega e redireciona para `/login`
2. Registrar uma conta nova funciona — e registrar de novo com o mesmo e-mail mostra o erro no campo
3. Login, criar categoria, criar transação
4. Dashboard reflete a transação no saldo e no top de categorias
5. Filtrar transações por tipo, categoria e intervalo de datas
6. Editar e remover, conferindo os toasts
7. Recarregar a página (F5) mantém a sessão
8. Logout limpa a sessão e o login seguinte busca dados do servidor
9. `GET /docs` do backend responde e o CORS aceita o domínio da Vercel

---

## Segurança

- Senhas com hash **bcrypt** (salt 10); o `passwordHash` nunca sai em nenhuma resposta
- JWT assinado com `JWT_SECRET`, expiração de 24h
- **Helmet** para headers de segurança
- **CORS** restrito a `FRONTEND_URL`
- DTOs com whitelist: campo desconhecido no corpo é rejeitado com 400
- Queries parametrizadas via TypeORM, inclusive o SQL cru do dashboard
- Todo acesso filtrado por `userId`; recurso de terceiro responde 404

---

## Convenções de desenvolvimento

1. Branch por feature: `git checkout -b feat/descricao`
2. Commits no padrão convencional: `feat(back): ...`, `fix(front): ...`
3. `npm run test` e `npm run lint` antes do PR
4. Sem `any` sem justificativa; sem secrets versionados — documente em `.env.example`
