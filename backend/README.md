# Backend — Fintech Expenses

API NestJS 12 em TypeScript strict mode: autenticação JWT, isolamento multi-usuário e um dashboard cujas agregações rodam no PostgreSQL.

- **Runtime**: Node.js 18+, ESM (`"type": "module"`)
- **Porta padrão**: `3000` — Swagger em `http://localhost:3000/docs`
- **Testes**: 49 unitários em 7 arquivos (Vitest)

---

## Como executar

```bash
# 1. banco (na raiz do repositório)
docker-compose up -d

# 2. dependências e ambiente
cd backend
npm install
cp .env.example .env

# 3. schema e dados de exemplo
npm run typeorm:migration:run
npm run seed

# 4. servidor
npm run dev     # hot-reload
npm run prod    # build já compilado (dist/main.js)
```

Usuário criado pelo seed: **demo@example.com** / **password123**.

### Scripts

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Nest em watch mode |
| `npm run build` | Compila para `dist/` |
| `npm run prod` | Executa `dist/main.js` (start command do deploy) |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:watch` / `test:cov` | Watch mode / cobertura |
| `npm run test:e2e` | Testes end-to-end |
| `npm run lint` / `npm run format` | ESLint com auto-fix / Prettier |
| `npm run typeorm:migration:run` | Aplica as migrations pendentes |
| `npm run typeorm:migration:generate -- src/database/migrations/<Nome>` | Gera uma migration a partir das entidades |
| `npm run typeorm:migration:revert` / `:show` | Desfaz a última / lista o status |
| `npm run seed` | Popula o usuário demo (idempotente — sai se ele já existir) |

---

## Variáveis de ambiente

| Variável | Padrão local | Descrição |
|----------|--------------|-----------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/fintech_expenses` | Connection string completa; é o que a Railway fornece |
| `DB_HOST` `DB_PORT` `DB_USERNAME` `DB_PASSWORD` `DB_NAME` | `localhost` `5432` `postgres` `postgres` `fintech_expenses` | Alternativa por campos, para desenvolvimento |
| `JWT_SECRET` | — | **Obrigatório em produção.** Gere com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `development` | Em `production` o CORS deixa de liberar localhost |
| `PORT` | `3000` | Porta HTTP (a Railway injeta a dela) |
| `FRONTEND_URL` | `http://localhost:5173` | Origens de CORS permitidas, separadas por vírgula |

---

## Estrutura

```
backend/
├── src/
│   ├── auth/                       # registro, login, emissão e validação de JWT
│   │   ├── dtos/                   # login.dto, register.dto, auth-response.dto
│   │   ├── guards/jwt.guard.ts     # JwtAuthGuard aplicado nas rotas protegidas
│   │   ├── strategies/jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.service.spec.ts
│   ├── users/                      # perfil do usuário autenticado
│   ├── categories/                 # CRUD com escopo por usuário
│   ├── transactions/               # CRUD + filtros + paginação
│   ├── dashboard/                  # agregações somente leitura
│   ├── common/
│   │   ├── config/cors.config.ts           # lista de origens + regra de localhost
│   │   ├── decorators/current-user.decorator.ts
│   │   ├── dtos/error-response.dto.ts      # formato de erro documentado no Swagger
│   │   ├── filters/http-exception.filter.ts
│   │   └── interceptors/transform-response.interceptor.ts
│   ├── database/
│   │   ├── migrations/1000000000000-InitialSchema.ts
│   │   ├── data-source.ts          # DataSource da aplicação
│   │   ├── typeorm.config.ts       # DataSource usado pela CLI do TypeORM
│   │   └── seed.ts
│   ├── app.controller.ts           # health check em GET /
│   ├── app.module.ts
│   └── main.ts                     # pipes, filtros, interceptors, helmet, CORS, Swagger
├── test/app.e2e-spec.ts
├── railway.json
└── .env.example
```

Cada módulo de domínio segue o mesmo formato: `*.module.ts` para a montagem, `*.controller.ts` só com HTTP e Swagger, `*.service.ts` com a regra de negócio, `dtos/` para entrada e saída e `entities/` para o mapeamento TypeORM. Os testes ficam ao lado do serviço, como `*.service.spec.ts`.

---

## Decisões arquiteturais

### Schema e regras de cascade

| Tabela | Colunas |
|--------|---------|
| `users` | `id` (uuid PK), `name`, `email` (unique), `passwordHash`, `createdAt`, `updatedAt` |
| `categories` | `id` (uuid PK), `name`, `description`, `userId` (FK → users, CASCADE), timestamps |
| `transactions` | `id` (uuid PK), `description`, `amount` (`numeric(10,2)`), `type` (enum `ENTRADA`/`SAIDA`), `date`, `categoryId` (FK → categories, RESTRICT), `userId` (FK → users, CASCADE), timestamps |

- Apagar um usuário cascateia para categorias e transações.
- Apagar uma categoria com transações é **RESTRICT**: o histórico financeiro não pode ficar órfão. O banco rejeita a remoção e a requisição falha — hoje o erro do driver sobe pelo filtro global como 500; mapeá-lo para 409 com mensagem própria é uma melhoria conhecida.
- Índices em `userId`, `categoryId` e `date` — exatamente as colunas dos filtros e das agregações.
- `amount` é `numeric(10,2)`, nunca float: dinheiro não admite erro de ponto flutuante binário. O valor é sempre positivo e o sinal vem do `type`, o que mantém as agregações explícitas.

### Isolamento multi-usuário: 404 em vez de 403

Todo acesso carrega o `userId` do token no `WHERE`:

```typescript
return this.repo.findOne({
  where: { id: categoryId, userId }, // as duas condições, sempre
});
// dono diferente → null → NotFoundException (404)
```

Um 403 confirmaria a existência do recurso. Com 404, o cliente não distingue "não existe" de "não é seu".

### Pipeline global

Ordem de execução para toda requisição, montada em `main.ts`:

1. **Helmet** — headers de segurança
2. **CORS** — `buildCorsOptions()`
3. **ValidationPipe** — `whitelist`, `forbidNonWhitelisted`, `transform`: campo desconhecido no corpo vira 400, e não uma gravação silenciosa
4. **JwtAuthGuard** — nas rotas protegidas, resolve o usuário e o injeta via `@CurrentUser()`
5. **TransformResponseInterceptor** — envelopa sucesso em `{ data }`, ou `{ data, meta }` em listas paginadas
6. **GlobalExceptionFilter** — normaliza todo erro em `{ statusCode, message, timestamp, path }` e loga o stack de erros não-HTTP

Concentrar isso em middleware global mantém os controllers com HTTP e Swagger apenas — nenhum deles monta envelope ou trata erro na mão.

### Agregações no banco

Três queries em `dashboard.service.ts`, todas parametrizadas:

```sql
-- 1. Saldo all-time (ignora o filtro de datas de propósito)
SELECT COALESCE(SUM(CASE WHEN type = 'ENTRADA' THEN amount ELSE 0 END), 0)
     - COALESCE(SUM(CASE WHEN type = 'SAIDA'   THEN amount ELSE 0 END), 0) AS balance
FROM transactions WHERE "userId" = $1;

-- 2. Totais do período, agrupados por tipo
SELECT type, SUM(amount) AS total
FROM transactions
WHERE "userId" = $1 AND date >= $2 AND date <= $3
GROUP BY type;

-- 3. Top 3 categorias por saída no período
SELECT c.id, c.name, COALESCE(SUM(t.amount), 0) AS "totalOutflow"
FROM categories c
LEFT JOIN transactions t
  ON c.id = t."categoryId" AND t."userId" = $1 AND t.type = 'SAIDA' AND t.date BETWEEN $3 AND $4
WHERE c."userId" = $1
GROUP BY c.id, c.name
ORDER BY "totalOutflow" DESC
LIMIT 3;
```

Por que em SQL e não em JavaScript: trafega um número em vez da lista inteira de transações, aproveita os índices e mantém o cálculo junto dos dados. O `LEFT JOIN` a partir de `categories` faz categorias sem gasto aparecerem com zero, em vez de sumirem do ranking.

O **saldo é all-time por decisão de produto**: é o dinheiro que a pessoa tem, não o resultado da janela filtrada. Só os totais do período e o top de categorias respondem a `startDate`/`endDate` — e há teste para os dois comportamentos.

### CORS

`FRONTEND_URL` aceita uma lista separada por vírgulas, então uma mesma implantação atende produção e staging. Fora de produção, qualquer porta de `localhost`/`127.0.0.1` passa, porque o Vite troca de porta quando a 5173 está ocupada e o browser trata `localhost` e `127.0.0.1` como origens distintas. A origem é normalizada (barra final e caixa) antes da comparação, e uma origem barrada é registrada em log e respondida sem os headers de CORS — devolver 500 nesse caso esconderia a causa real.

### Migrations em vez de `synchronize`

O schema muda apenas por migration versionada. `synchronize: true` reescreveria tabelas a partir das entidades a cada boot, o que é perda de dado garantida em produção. A CLI usa um DataSource próprio (`typeorm.config.ts`), separado do que a aplicação injeta.

### Segurança

- **bcrypt** com salt 10; o `passwordHash` fica fora de todo DTO de resposta (há teste para isso)
- JWT assinado com `JWT_SECRET`, expiração de 24h, transportado em `Authorization: Bearer`
- Queries parametrizadas em toda parte, incluindo o SQL cru do dashboard
- `forbidNonWhitelisted` bloqueia campos extras — nada de mass assignment
- A criação de transação valida que a `categoryId` pertence ao usuário antes de gravar

---

## Testes

```bash
npm run test        # 49 testes, 7 arquivos
npm run test:cov
npm run test:e2e
```

Serviços testados com repositórios mockados — sem banco, execução em menos de um segundo.

### Auth (`auth.service.spec.ts`)
Registro emite token e cria usuário; e-mail duplicado é rejeitado; login de usuário inexistente falha; a estratégia JWT resolve o usuário do token. É a fronteira de segurança: os testes garantem que a senha não vaza na resposta e que a unicidade do e-mail é barrada no serviço, não só pelo índice do banco.

### Users (`users.service.spec.ts`)
Perfil retorna sem `passwordHash`; usuário inexistente devolve null.

### Categories (`categories.service.spec.ts`)
CRUD completo mais **ownership**: buscar, atualizar e remover categoria de outro usuário lança `NotFoundException`. Listagem ordenada por criação decrescente. Cada caso confirma o `userId` na cláusula `WHERE`.

### Transactions (`transactions.service.spec.ts`)
Paginação (padrão página 1 / limite 10, e a matemática de `skip`/`take`/`totalPages`), filtros por tipo, categoria e intervalo de datas, e **composição de filtros com AND** — combinar tipo + categoria + data precisa restringir o resultado, nunca ampliá-lo. Mais a validação de que a categoria pertence ao usuário na criação e o escopo por usuário em busca e remoção.

### Dashboard (`dashboard.service.spec.ts`)
Saldo como `ENTRADA - SAIDA` e o caso sem transações; filtro de data aplicado aos totais do período **e não** ao saldo; top 3 ordenado por saída decrescente, com menos de três quando não há dados suficientes; filtros de data repassados como parâmetro na query do ranking.

### CORS (`cors.config.spec.ts`)
Lista separada por vírgulas, normalização de barra final e caixa, liberação de localhost fora de produção e bloqueio dela em produção.

---

## Deploy na Railway

1. Crie o projeto e adicione um serviço **PostgreSQL**.
2. Adicione o serviço Node apontando para `backend/`. O `railway.json` já define builder nixpacks e `npm run prod` como start command.
3. Configure as variáveis:

| Variável | Valor |
|----------|-------|
| `DATABASE_URL` | referência ao serviço PostgreSQL |
| `JWT_SECRET` | string aleatória de 32+ caracteres |
| `FRONTEND_URL` | URL da Vercel (sem barra final) |
| `NODE_ENV` | `production` |

4. Adicione um pre-deploy hook com `npm run typeorm:migration:run`.
5. Rode `npm run seed` uma vez pelo console, se quiser os dados de demonstração.
6. Verifique: `curl https://<host>/` responde o health check e `/docs` carrega o Swagger.

### Troubleshooting

- **Falha de conexão ao banco** — confira se `DATABASE_URL` referencia o serviço PostgreSQL do projeto.
- **Tabelas ausentes** — o pre-deploy hook das migrations não rodou.
- **CORS bloqueado no frontend** — o log do boot imprime as origens aceitas; compare com o domínio real da Vercel, sem barra final.
- **`JWT_SECRET` ausente** — em desenvolvimento cai num segredo padrão; em produção, defina explicitamente.

---

## Documentação da API

`http://localhost:3000/docs` (OpenAPI JSON em `/docs-json`). A página traz um passo a passo: pegue o token em `POST /auth/login`, clique em **Authorize**, cole o `data.accessToken` e chame as demais rotas. `persistAuthorization` está ligado, então o token sobrevive ao reload.

Convenções documentadas ali:

- Sucesso sempre em `{ data }`; listas paginadas acrescentam `meta`
- Erro sempre em `{ statusCode, message, timestamp, path }`
- Valor é um `amount` positivo mais um `type`: `ENTRADA` ou `SAIDA`
- Datas em ISO-8601 (`2026-08-05` ou `2026-08-05T14:30:00.000Z`)
- Campo desconhecido no corpo → 400
- Tudo tem escopo do dono do token; recurso de terceiro responde 404
