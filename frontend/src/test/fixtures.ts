import type {
  Category,
  DashboardSummary,
  PaginatedResponse,
  Transaction,
  User,
} from '../types';

export const testUser: User = {
  id: 'user-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

export const testToken = 'test-access-token';

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'category-1',
    name: 'Groceries',
    description: 'Food and supermarket',
    userId: testUser.id,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'transaction-1',
    description: 'Weekly shopping',
    amount: 120.5,
    type: 'SAIDA',
    date: '2026-02-10',
    categoryId: 'category-1',
    userId: testUser.id,
    createdAt: '2026-02-10T00:00:00.000Z',
    updatedAt: '2026-02-10T00:00:00.000Z',
    ...overrides,
  };
}

export function makeDashboard(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    balance: 1500,
    totalEntrada: 3000,
    totalSaida: 1500,
    topCategories: [
      { categoryId: 'category-1', categoryName: 'Groceries', totalOutflow: 900 },
      { categoryId: 'category-2', categoryName: 'Transport', totalOutflow: 600 },
    ],
    ...overrides,
  };
}

export function paginate<T>(
  data: T[],
  meta: Partial<PaginatedResponse<T>['meta']> = {}
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      total: data.length,
      page: 1,
      limit: 10,
      totalPages: Math.max(1, Math.ceil(data.length / 10)),
      ...meta,
    },
  };
}

/** Puts a signed-in session in localStorage, the way AuthContext reads it. */
export function signIn(user: User = testUser): void {
  localStorage.setItem('accessToken', testToken);
  localStorage.setItem('user', JSON.stringify(user));
}
