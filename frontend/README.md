# Frontend — React 19 + Vite + TypeScript

SPA de gestão de despesas. **React Query** cuida do estado do servidor, **Context API** da sessão e dos toasts, e **MUI v9** da interface, sobre um tema próprio.

- **Dev server**: `http://localhost:5173`
- **Backend esperado**: `http://localhost:3000` (configurável em `API_URL`)

---

## Como executar

```bash
npm install
cp .env.example .env   # API_URL=http://localhost:3000
npm run dev
```

Com o backend no ar e o seed aplicado, entre com **demo@example.com** / **password123**.

| Script | O que faz |
|--------|-----------|
| `npm run dev` | Vite em modo desenvolvimento |
| `npm run build` | `tsc --noEmit && vite build` — checagem de tipos e build de produção |
| `npm run preview` | Serve o `dist/` localmente |
| `npm run lint` | ESLint com auto-fix |

---

## Estrutura

```
src/
├── api/                  # uma função tipada por endpoint; desembrulha o { data } da resposta
│   ├── auth.ts           # register, login, getCurrentUser
│   ├── categories.ts     # list, create, update, remove
│   ├── transactions.ts   # list (filtros + paginação), create, update, remove
│   └── dashboard.ts      # resumo agregado
├── components/           # UI reutilizável
│   ├── Layout.tsx        # shell com sidebar (desktop) e topbar (mobile)
│   ├── ProtectedRoute.tsx
│   ├── DashboardCards.tsx / TopCategories.tsx
│   ├── CategoryList.tsx / CategoryForm.tsx
│   ├── TransactionList.tsx / TransactionForm.tsx / TransactionFormFields.tsx
│   ├── TransactionFilters.tsx / Pagination.tsx
│   └── ToastContainer.tsx
├── context/
│   ├── AuthContext.tsx   # usuário, token, login/register/logout
│   └── ToastContext.tsx  # fila de notificações
├── hooks/                # React Query: uma query ou mutation por operação
│   ├── useCategories.ts
│   ├── useTransactions.ts
│   └── useDashboard.ts
├── lib/
│   ├── client.ts         # instância Axios + interceptors de request e response
│   ├── errors.ts         # extrai a mensagem de erro real da API
│   ├── queryClient.ts    # defaults de cache do React Query
│   └── router.tsx        # árvore de rotas e rotas protegidas
├── pages/                # Dashboard, Transactions, Categories, Login, Register, NotFound
├── types/                # interfaces espelhando os DTOs do backend
├── theme.ts              # tema MUI (paleta, tipografia, formas)
├── App.tsx               # providers + RouterProvider
└── main.tsx
```

O caminho de um dado é sempre o mesmo: `pages/` monta a tela, chama um hook de `hooks/`, que chama uma função de `api/`, que usa o cliente de `lib/client.ts`. Componente nenhum fala com o Axios direto.

---

## Decisões arquiteturais

### React Query para estado do servidor

Categorias, transações e dashboard vivem no backend, podem ficar obsoletos e são pedidos por vários componentes. React Query entrega, sem código próprio: cache com `staleTime` de 5 minutos, deduplicação de requisições em voo, `isLoading`/`error` prontos e invalidação após mutação. Os defaults estão em `lib/queryClient.ts` (`gcTime` de 10 min, 1 retry, `refetchOnWindowFocus` desligado — o refetch a cada troca de aba incomodava mais do que ajudava num app de finanças).

A invalidação fica declarada nos hooks:

- categoria criada, editada ou removida → invalida a lista de categorias
- transação criada, editada ou removida → invalida as transações **e** o dashboard, que deriva delas
- remoção também faz `removeQueries` da entrada individual daquele id

Redux ou Zustand exigiriam actions, reducers e sincronização manual com a API para resolver o que a camada de cache já resolve.

### Context API para sessão e toasts

Sessão é estado do cliente: pequeno (usuário + token), lido com frequência e escrito raramente, persistido em `localStorage`. Não vem de fetch, então cache e invalidação não se aplicam — um Context é mais simples e mantém autenticação separada dos dados de domínio.

### A sessão é restaurada de forma síncrona

O usuário é lido do `localStorage` no *inicializador* do `useState`, não em um `useEffect`:

```typescript
const [user, setUser] = useState<User | null>(readStoredUser);
```

Com o efeito, a primeira renderização tinha `user === null`, o `ProtectedRoute` navegava para `/login`, e a restauração chegava tarde demais — a sessão sumia a cada F5. O inicializador roda antes da primeira renderização, então a rota protegida já enxerga o usuário.

### Logout limpa o cache

`logout()` chama `queryClient.clear()`, descartando todas as queries de uma vez em vez de enumerar chaves que ficariam desatualizadas conforme novos hooks surgem. `login()` e `register()` também limpam antes de gravar o novo token, cobrindo a troca de conta sem reload. Sem isso, o próximo usuário veria por um instante os dados do anterior antes do refetch.

O botão de logout do `Layout` usa esse `logout()` do contexto — ele já removeu o token na mão uma vez, deixando o usuário no `localStorage` e no estado do Context, e a sessão "morta" voltava no refresh.

### Interceptors do Axios

`lib/client.ts` concentra dois comportamentos:

- **Request**: anexa `Authorization: Bearer <token>` quando existe token guardado
- **Response**: em 401, limpa a sessão e manda para `/login` — **exceto** em requisições `/auth/*`. Senha errada devolve 401, e tratá-la como sessão expirada recarregava a página e apagava a mensagem de erro que o formulário tinha acabado de exibir

### Mensagens de erro da API em um lugar só

`lib/errors.ts` lê a mensagem do corpo da resposta. Sem isso a tela mostrava `"Request failed with status code 400"`, texto do próprio Axios. O helper trata as duas formas produzidas pelo backend — `message` string vinda de uma `HttpException` e `message` array vinda da validação de DTO — e reconhece o caso de e-mail já cadastrado, que o registro exibe como erro no campo de e-mail (com foco) mais um alerta com atalho para o login, em vez de um banner vermelho genérico.

### MUI com tema central

A UI usa MUI v9 com Emotion e um tema em `theme.ts` (primária âmbar `#eab308`, superfícies neutras, `borderRadius` 10, tipografia Inter, botões sem caixa alta). Componentes acessíveis prontos — diálogos, campos com estado de erro, tabelas, drawer responsivo — custam menos tempo que reconstruí-los, e o tema mantém a identidade visual num lugar só, sem classes utilitárias espalhadas pelo JSX. O `index.css` fica com o mínimo: reset de box-sizing, fonte do body e altura do `#root`.

### Validação com React Hook Form + Zod

Cada formulário tem um schema Zod ao lado (`registerSchema`, `loginSchema`, ...) e o `zodResolver` liga a validação aos campos. O tipo do formulário sai de `z.infer`, então schema e tipos não divergem. A validação do cliente é UX — a do servidor continua sendo a que vale, e erros que só o backend conhece (e-mail duplicado) voltam para o campo certo via `setError`.

### Rotas

`lib/router.tsx` usa `createBrowserRouter`. `/login` e `/register` são públicas; o resto fica sob `<ProtectedRoute />`, que redireciona quem não tem sessão, e dentro de `<Layout />`, que fornece o shell. O `vercel.json` reescreve todo caminho para `index.html`, sem o que um F5 em `/transactions` daria 404 no servidor estático.

### Sem Redux, sem Zustand

Com estado do servidor no React Query e estado do cliente no Context, não sobra estado global para um terceiro gerenciador administrar. Menos dependência, menos código de ligação.

---

## Camada de API

Cada função devolve o dado já desembrulhado do envelope `{ data }` do backend.

| Módulo | Funções |
|--------|---------|
| `api/auth.ts` | `register(payload)`, `login(payload)`, `getCurrentUser()` |
| `api/categories.ts` | `getCategories()`, `getCategory(id)`, `createCategory(data)`, `updateCategory(id, data)`, `deleteCategory(id)` |
| `api/transactions.ts` | `getTransactions(filters)`, `getTransaction(id)`, `createTransaction(data)`, `updateTransaction(id, data)`, `deleteTransaction(id)` |
| `api/dashboard.ts` | `getDashboard(params?)` — `startDate` / `endDate` |

`getTransactions` aceita `type`, `categoryId`, `startDate`, `endDate`, `page` e `limit`, e devolve os itens junto do `meta` de paginação.

### Uso dos hooks

```typescript
// leitura
const { data: categories, isLoading, error } = useCategories();

// escrita — a invalidação já está declarada no hook
const createCategory = useCreateCategory();

createCategory.mutate(
  { name: 'Alimentação', description: 'Gastos com comida' },
  {
    onSuccess: () => addToast('Categoria criada', 'success'),
    onError: (error) => addToast(getApiErrorMessage(error, 'Falha ao criar'), 'error'),
  }
);
```

---

## Fluxo de autenticação

1. Login ou registro devolve `accessToken` e o usuário; ambos vão para o `localStorage` e para o Context
2. O interceptor de request anexa o token em toda chamada seguinte
3. No refresh, o Context relê o `localStorage` de forma síncrona e a sessão continua
4. Um 401 fora de `/auth/*` significa token expirado ou inválido: sessão limpa e volta para `/login`
5. Logout limpa `localStorage`, Context e o cache do React Query, e navega com `replace` para que o botão voltar não retorne à área logada

---

## Tratamento de erros e estados

- Erro de validação aparece inline no campo (`helperText` do MUI)
- Erro de API vira toast ou alerta na tela, sempre com a mensagem que o backend enviou
- Loading e estado vazio são tratados explicitamente em cada página — nada de tela em branco silenciosa

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `API_URL` | `http://localhost:3000` | URL base da API. Sem ela, `lib/client.ts` cai nesse mesmo padrão |

Variáveis do Vite são embutidas no bundle em tempo de build: só valores públicos, nunca segredo.

---

## Deploy na Vercel

1. Importe o repositório e defina `frontend/` como root directory
2. Em Settings → Environment Variables, configure `API_URL` com a URL pública do backend
3. Deploy

O `vercel.json` já traz build (`npm run build`), output (`dist`) e o rewrite de SPA. Depois do deploy, confirme que a URL redireciona para `/login` e que `FRONTEND_URL` no backend inclui o domínio da Vercel — senão o navegador barra as chamadas por CORS.
