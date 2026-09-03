import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity.js';

export class CreateTransactionDto {
  @ApiProperty({
    description: 'Short human-readable description of the movement.',
    example: 'Supermarket',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description:
      'Absolute value of the movement, always positive. The sign is derived from `type`, not from this field. Stored with 2 decimal places.',
    example: 120.5,
    minimum: 0.01,
    type: Number,
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description:
      'Direction of the movement: `ENTRADA` (money in) or `SAIDA` (money out).',
    enum: TransactionType,
    enumName: 'TransactionType',
    example: TransactionType.SAIDA,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    description:
      'Date the movement happened, as an ISO-8601 string (`YYYY-MM-DD` or a full timestamp).',
    example: '2026-08-05',
    format: 'date-time',
  })
  @IsDateString()
  date: string;

  @ApiProperty({
    description:
      'UUID of a category owned by the authenticated user. A category belonging to someone else (or a non-existent one) returns 400.',
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID()
  categoryId: string;
}
