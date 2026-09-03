# Backend - Desafio de Despesas Fintech

API backend em NestJS com TypeScript para gerenciamento de despesas. Suporta autenticação JWT, isolamento multi-usuário e dashboard com agregações no banco de dados.

## Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- npm ou yarn

## Como executar

### 1. Instalação

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
```

Verifique as variáveis (padrões funcionam para desenvolvimento local):

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=fintech_db
JWT_SECRET=seu-chave-secreta-minimo-32-caracteres
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Iniciar o banco de dados

```bash
docker-compose up -d
```

### 4. Executar migrações

```bash
npm run build
npm run typeorm migration:run
```

### 5. Popular dados de demo

```bash
npm run seed
```

Isso cria um usuário de teste:
- **Email:** demo@example.com
- **Senha:** password123

### 6. Iniciar o servidor

```bash
# Desenvolvimento com hot-reload
npm run dev

# Produção
npm run build
npm run start
```

O servidor sobe em `http://localhost:3001`.

**Documentação da API:** `http://localhost:3001/docs` (Swagger com autenticação Bearer)

## Testes

Executar a suite de testes:

```bash
npm run test        # Executa todos os testes
npm run test:watch  # Modo observe
```

**Resultado esperado:** 38 testes passando, 0 falhando

Os testes cobrem lógica de negócio core em 6 módulos com repositórios mockados (Vitest):

### Auth Module (4 tests)

**Purpose**: Validates user registration and login workflows with security controls.

- Register a new user successfully - confirms JWT token generation and user creation
- Reject duplicate email during registration - enforces unique email constraint
- Reject login if user not found - validates authentication failure
- Validate user existence - confirms JWT strategy can fetch user data

**Why tested**: Authentication is the security boundary. Tests ensure password never leaks in responses and duplicate emails are rejected at the service level.

### Users Module (2 tests)

**Purpose**: Validates user profile retrieval without exposing sensitive data.

- Return user profile without password hash - confirms password hashes never leak to clients
- Return null if user not found - handles missing user gracefully

**Why tested**: Password hash is internal; leaking it violates security. Tests enforce data privacy.

### Categories Module (9 tests)

**Purpose**: Validates CRUD operations and user ownership enforcement.

- Create a category for the user - adds category with userId scoping
- Return all categories for the user ordered by creation date DESC - enforces ownership filter and ordering
- Find category owned by user - validates scoped retrieval
- Throw NotFoundException if category not found - 404 on missing resource
- Throw NotFoundException if category belongs to another user - **ownership enforcement**: cross-user access returns 404 (not 403) to avoid leaking resource existence
- Update category owned by user - modifies only owned resources
- Throw NotFoundException on update if category belongs to another user - prevents cross-user updates
- Remove category owned by user - deletes only owned resources
- Throw NotFoundException on remove if category belongs to another user - prevents cross-user deletes

**Why tested**: Multi-user isolation. Every test confirms userId is checked in WHERE clauses; unauthorized users see 404, not 403.

### Transactions Module (14 tests)

**Purpose**: Validates pagination, filtering, category ownership validation, and user-scoped access.

**Pagination & Metadata**:
- Return paginated transactions with default pagination (page 1, limit 10)
- Calculate correct pagination for multiple pages - tests skip/take math and totalPages calculation

**Filtering**:
- Filter by transaction type (ENTRADA/SAIDA)
- Filter by categoryId
- Filter by date range (startDate/endDate)
- Compose multiple filters with AND logic - combines type + categoryId + date filters (refinement, not expansion)

**CRUD & Ownership**:
- Create transaction with valid category - validates category belongs to user before creating transaction
- Reject transaction with non-existent category - prevents invalid categoryId references
- Reject transaction with category from another user - category ownership is checked (BadRequestException)
- Find transaction owned by user - scoped retrieval by userId
- Throw NotFoundException if transaction not found or belongs to another user
- Remove transaction owned by user
- Throw NotFoundException on remove if transaction belongs to another user

**Why tested**: Complex multi-step filtering (pagination + type + categoryId + dates) must compose correctly. Category ownership validation prevents invalid foreign keys. User scoping prevents data leaks.

### Dashboard Module (8 tests)

**Purpose**: Validates aggregation queries for financial summaries.

**Balance Calculation**:
- Calculate correct balance from all-time transactions - CASE WHEN aggregate: (ENTRADA - SAIDA)
- Calculate balance with zero transactions - handles empty state

**Period Filtering**:
- Apply date filters to period totals only - startDate/endDate filter ENTRADA/SAIDA sums (not balance)
- Do not apply date filters to balance calculation - balance is all-time, unaffected by date range

**Top Categories**:
- Return top 3 categories ordered by outflow descending
- Return fewer than 3 categories if not enough data - handles sparse data
- Apply date filters to top categories query - parameterized SQL includes date filters

**Why tested**: Dashboard aggregations use raw SQL with GROUP BY, SUM, and ORDER BY...LIMIT 3. Tests confirm: (1) balance logic (ENTRADA - SAIDA), (2) period totals respect date filters while balance doesn't, (3) top 3 ordering and count limits are correct, (4) parameterized queries prevent SQL injection.

## Linting e Qualidade

```bash
npm run lint        # ESLint check e auto-fix
npm run format      # Prettier format
```

- **TypeScript Strict Mode:** habilitado (nenhuma supressão `@ts-ignore` no código de produção)
- **ESLint:** configurado para NestJS com regras estritas
- **Prettier:** formatação automática

## 🏗️ Decisões de Arquitetura

### Esquema do Banco de Dados

- **users**: id (PK), name, email (unique), passwordHash, created_at, updated_at
- **categories**: id (PK), name, description, userId (FK, CASCADE), created_at, updated_at
- **transactions**: id (PK), description, amount (decimal 10,2), type (ENTRADA/SAIDA), date, categoryId (FK, RESTRICT), userId (FK, CASCADE), created_at, updated_at

**Regras de cascade:**
- Deletar um usuário cascata para suas categorias e transações
- Deletar uma categoria é RESTRITO se transações a referenciam (integridade referencial)

### Isolamento Multi-Usuário

Todas as queries filtram por `userId` autenticado. Acesso cross-user retorna **404** (não 403) para evitar vazar existência de recursos:

```typescript
// Exemplo: findOne(userId, categoryId)
return this.repo.findOne({
  where: { id: categoryId, userId }, // Ambas as condições required
});
// Se usuário diferente: retorna null → NotFoundException (404)
```

### Pipeline Global de Middleware

1. **ValidationPipe**: Valida DTOs (whitelist, forbid unknown properties)
2. **JwtAuthGuard**: Extrai e verifica JWT em rotas protegidas
3. **ResponseInterceptor**: Envelopa responses em `{data}` ou `{data, meta}`
4. **HttpExceptionFilter**: Padroniza erro: `{statusCode, message, error, timestamp, path}`
5. **Helmet**: Headers de segurança (XSS, CSP, etc)
6. **CORS**: Requests cross-origin de FRONTEND_URL

### Agregações no Dashboard

Todos os cálculos acontecem em SQL (não em JavaScript):

```sql
-- Saldo: all-time ENTRADA - SAIDA com CASE WHEN
SELECT SUM(CASE WHEN type = 'ENTRADA' THEN amount ELSE -amount END) as balance
FROM transactions WHERE userId = $1

-- Totais por período: agrupados por tipo com filtros de data
SELECT type, SUM(amount) as total FROM transactions 
WHERE userId = $1 AND date BETWEEN $2 AND $3 
GROUP BY type

-- Top 3 categorias: raw SQL com LEFT JOIN
SELECT c.id, c.name, SUM(t.amount) as totalOutflow
FROM transactions t
LEFT JOIN categories c ON t.categoryId = c.id
WHERE t.userId = $1 AND t.type = 'SAIDA' AND t.date BETWEEN $2 AND $3
GROUP BY c.id
ORDER BY totalOutflow DESC LIMIT 3
```

## Contribuição

### Workflow de desenvolvimento

1. Crie uma branch para sua feature: `git checkout -b feature/descricao`
2. Faça mudanças incrementais com commits descritivos
3. Execute testes: `npm run test`
4. Execute lint: `npm run lint`
5. Abra um pull request com descrição clara

### Padrões de código

- **Sem `any` sem justificativa**: Type safety é obrigatório
- **Módulos NestJS pequenos e focados**: Um responsabilidade por módulo
- **Testes para regras de negócio**: Não apenas happy-path
- **Sem secrets no git**: Use `.env.example` para documentar variáveis

### Stack técnico

- **NestJS 10+** com TypeScript strict
- **TypeORM** para ORM + migrations
- **PostgreSQL 16** (local via Docker Compose)
- **JWT** com Passport para autenticação
- **Vitest** para testes unitários
- **Swagger** para documentação automática da API
