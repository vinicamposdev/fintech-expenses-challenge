import { HttpResponse, http } from 'msw';
import { baseURL } from '../lib/client';
import {
  makeCategory,
  makeDashboard,
  makeTransaction,
  paginate,
  testToken,
  testUser,
} from './fixtures';

export const api = (path: string): string => `${baseURL}${path}`;

/**
 * The backend wraps every payload in `{ data }` (plus `meta` when paginated),
 * so the handlers mirror that shape - tests would otherwise pass against a
 * response the real API never sends.
 */
export const handlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (body.password === 'wrong-password') {
      return HttpResponse.json(
        { statusCode: 401, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      data: { accessToken: testToken, user: { ...testUser, email: body.email } },
    });
  }),

  http.post(api('/auth/register'), async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string };

    if (body.email === 'taken@example.com') {
      return HttpResponse.json(
        { statusCode: 409, message: 'Email already registered' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      data: { accessToken: testToken, user: { ...testUser, name: body.name, email: body.email } },
    });
  }),

  http.get(api('/users/me'), () => HttpResponse.json({ data: testUser })),

  http.get(api('/categories'), () =>
    HttpResponse.json({
      data: [
        makeCategory(),
        makeCategory({ id: 'category-2', name: 'Transport', description: 'Bus and fuel' }),
      ],
    })
  ),

  http.get(api('/categories/:id'), ({ params }) =>
    HttpResponse.json({ data: makeCategory({ id: String(params.id) }) })
  ),

  http.post(api('/categories'), async ({ request }) => {
    const body = (await request.json()) as { name: string; description?: string };
    return HttpResponse.json(
      { data: makeCategory({ id: 'category-new', ...body }) },
      { status: 201 }
    );
  }),

  http.patch(api('/categories/:id'), async ({ params, request }) => {
    const body = (await request.json()) as { name?: string; description?: string };
    return HttpResponse.json({ data: makeCategory({ id: String(params.id), ...body }) });
  }),

  http.delete(api('/categories/:id'), () => new HttpResponse(null, { status: 204 })),

  http.get(api('/transactions'), () =>
    HttpResponse.json(
      paginate([
        makeTransaction(),
        makeTransaction({
          id: 'transaction-2',
          description: 'Salary',
          amount: 3000,
          type: 'ENTRADA',
          categoryId: 'category-2',
        }),
      ])
    )
  ),

  http.get(api('/transactions/:id'), ({ params }) =>
    HttpResponse.json({ data: makeTransaction({ id: String(params.id) }) })
  ),

  http.post(api('/transactions'), async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      { data: makeTransaction({ id: 'transaction-new', ...body }) },
      { status: 201 }
    );
  }),

  http.patch(api('/transactions/:id'), async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ data: makeTransaction({ id: String(params.id), ...body }) });
  }),

  http.delete(api('/transactions/:id'), () => new HttpResponse(null, { status: 204 })),

  http.get(api('/dashboard'), () => HttpResponse.json({ data: makeDashboard() })),
];
