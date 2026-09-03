import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from '../../common/dtos/error-response.dto.js';
import { TransactionType } from '../entities/transaction.entity.js';

export class TransactionDto {
  @ApiProperty({
    format: 'uuid',
    example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  })
  id: string;

  @ApiProperty({ example: 'Supermarket' })
  description: string;

  @ApiProperty({
    description: 'Positive value with 2 decimals; direction comes from `type`.',
    example: 120.5,
  })
  amount: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.SAIDA })
  type: TransactionType;

  @ApiProperty({ format: 'date-time', example: '2026-08-05T00:00:00.000Z' })
  date: string;

  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  categoryId: string;

  @ApiProperty({
    format: 'uuid',
    example: '9f1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  })
  userId: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-05T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-05T12:00:00.000Z' })
  updatedAt: string;
}

export class TransactionResponseDto {
  @ApiProperty({ type: TransactionDto })
  data: TransactionDto;
}

export class TransactionListResponseDto {
  @ApiProperty({
    type: [TransactionDto],
    description: 'Page of transactions, ordered by `date` descending.',
  })
  data: TransactionDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
