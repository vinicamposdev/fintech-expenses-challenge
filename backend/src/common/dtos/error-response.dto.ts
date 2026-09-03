import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Shape produced by GlobalExceptionFilter for every failed request.
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'HTTP status code.', example: 400 })
  statusCode: number;

  @ApiProperty({
    description:
      'Human-readable message. For validation failures this is an array with one entry per invalid field.',
    example: ['amount must not be less than 0.01'],
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  })
  message: string | string[];

  @ApiPropertyOptional({
    description: 'Short error label, when the exception carries one.',
    example: 'Bad Request',
  })
  error?: string;

  @ApiProperty({
    description: 'When the error was produced.',
    example: '2026-08-20T12:34:56.789Z',
    format: 'date-time',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Path of the request that failed.',
    example: '/transactions',
  })
  path: string;
}

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total rows matching the filters.', example: 42 })
  total: number;

  @ApiProperty({ description: 'Page that was returned.', example: 1 })
  page: number;

  @ApiProperty({ description: 'Page size that was applied.', example: 10 })
  limit: number;

  @ApiProperty({
    description: 'Number of pages available: `ceil(total / limit)`.',
    example: 5,
  })
  totalPages: number;
}
