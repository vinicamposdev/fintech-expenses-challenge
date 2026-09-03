import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface SuccessResponse<T = unknown> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (Array.isArray(data)) {
          return { data };
        }

        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return data as SuccessResponse;
        }

        if (data && typeof data === 'object' && 'data' in data) {
          return data as SuccessResponse;
        }

        return { data };
      }),
    );
  }
}
