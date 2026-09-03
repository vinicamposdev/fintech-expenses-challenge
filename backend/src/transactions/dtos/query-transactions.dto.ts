import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '../entities/transaction.entity.js';

export class QueryTransactionsDto {
  @ApiPropertyOptional({
    description: '1-based page number.',
    example: 1,
    default: 1,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of transactions per page.',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 100,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Keep only inflows (`ENTRADA`) or only outflows (`SAIDA`).',
    enum: TransactionType,
    enumName: 'TransactionType',
    example: TransactionType.SAIDA,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({
    description: 'Keep only transactions in this category.',
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description:
      'Inclusive lower bound for `date`, ISO-8601. Omit for no lower bound.',
    example: '2026-08-01',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description:
      'Inclusive upper bound for `date`, ISO-8601. Omit for no upper bound.',
    example: '2026-08-31',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
