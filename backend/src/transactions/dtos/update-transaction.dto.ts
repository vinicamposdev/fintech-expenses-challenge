import { PartialType } from '@nestjs/swagger';
import { CreateTransactionDto } from './create-transaction.dto.js';

/**
 * Every field is optional — send only what changes.
 */
export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}
