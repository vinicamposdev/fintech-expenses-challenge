import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module.js';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter.js';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor.js';
import { buildCorsOptions } from './common/config/cors.config.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new GlobalExceptionFilter(httpAdapterHost));

  // Global response interceptor
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Helmet for security headers
  app.use(helmet());

  // CORS configuration
  app.enableCors(buildCorsOptions());

  // Swagger/OpenAPI documentation
  const description = [
    'Backend API for fintech expense management: categories, transactions and a financial dashboard, scoped to the authenticated user.',
    '',
    '## Getting started',
    '',
    '1. **Get a token** — `POST /auth/login` with the seeded demo account (`npm run seed`):',
    '   `{ "email": "demo@example.com", "password": "password123" }`.',
    '   No seed? Use `POST /auth/register`, which also returns a token.',
    '2. **Authorize** — click **Authorize** at the top of this page and paste `data.accessToken`.',
    '   Outside Swagger, send it as `Authorization: Bearer <token>` (valid for 24h).',
    '3. **Create a category** — `POST /categories`, keep the returned `id`.',
    '4. **Record a transaction** — `POST /transactions` using that `id` as `categoryId`.',
    '5. **Read the numbers** — `GET /transactions` (filters + pagination) and `GET /dashboard`.',
    '',
    '## Conventions',
    '',
    '- Every successful response is wrapped in a `data` envelope; paginated lists add `meta`.',
    '- Errors always look like `{ statusCode, message, timestamp, path }`.',
    '- Money is a positive `amount` plus a `type`: `ENTRADA` (in) or `SAIDA` (out).',
    '- Dates are ISO-8601 (`2026-08-05` or `2026-08-05T14:30:00.000Z`).',
    '- Unknown body fields are rejected with 400 (`forbidNonWhitelisted`).',
    "- Everything is scoped to the token owner: another user's row reads as 404.",
    '',
    '## Try it with curl',
    '',
    '```bash',
    'TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \\',
    "  -H 'Content-Type: application/json' \\",
    '  -d \'{"email":"demo@example.com","password":"password123"}\' | jq -r .data.accessToken)',
    '',
    'curl -s http://localhost:3000/dashboard?startDate=2026-08-01\\&endDate=2026-08-31 \\',
    '  -H "Authorization: Bearer $TOKEN"',
    '```',
  ].join('\n');

  const config = new DocumentBuilder()
    .setTitle('Fintech Expenses API')
    .setDescription(description)
    .setVersion('1.0.0')
    .addTag('health', 'Liveness check.')
    .addTag('auth', 'Register and log in — start here to get a bearer token.')
    .addTag('users', 'Profile of the authenticated user.')
    .addTag('categories', 'Buckets a transaction can belong to (per user).')
    .addTag('transactions', 'Cash movements, with filters and pagination.')
    .addTag(
      'dashboard',
      'Aggregated balance, period totals and top categories.',
    )
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Paste the `data.accessToken` returned by POST /auth/login or POST /auth/register (no "Bearer " prefix needed here).',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: '/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
    },
  });

  const port = process.env.PORT ?? 3000;
  // Bind to all interfaces explicitly — Node's default host (`::`) is
  // IPv6-only on some container images, which Railway's edge proxy can't
  // reach: the app never sees the request, so nothing shows up in the
  // logs, but every request comes back 502 at the proxy.
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Swagger documentation available at: http://localhost:${port}/docs`,
  );
}

await bootstrap();
