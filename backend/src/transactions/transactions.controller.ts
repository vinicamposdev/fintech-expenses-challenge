import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service.js';
import { Transaction } from './entities/transaction.entity.js';
import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { QueryTransactionsDto } from './dtos/query-transactions.dto.js';
import {
  TransactionResponseDto,
  TransactionListResponseDto,
} from './dtos/transaction-response.dto.js';
import { ErrorResponseDto } from '../common/dtos/error-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const TRANSACTION_ID_PARAM = {
  name: 'id',
  description: 'UUID of a transaction owned by the authenticated user.',
  format: 'uuid',
  example: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
} as const;

@ApiTags('transactions')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: 'Missing, expired or invalid bearer token.',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a transaction',
    description:
      'Records one movement. `amount` is always positive — use `type` to say whether money came in (`ENTRADA`) or went out (`SAIDA`). `categoryId` must be a category you own; get one from `GET /categories`.',
  })
  @ApiBody({
    type: CreateTransactionDto,
    examples: {
      expense: {
        summary: 'Expense (SAIDA)',
        description: 'A grocery purchase charged to the Alimentação category.',
        value: {
          description: 'Supermarket',
          amount: 120.5,
          type: 'SAIDA',
          date: '2026-08-05',
          categoryId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        },
      },
      income: {
        summary: 'Income (ENTRADA)',
        description: 'A client payment, dated with a full timestamp.',
        value: {
          description: 'Project completion payment',
          amount: 3500,
          type: 'ENTRADA',
          date: '2026-08-11T14:30:00.000Z',
          categoryId: '8c1f3d2e-9a4b-4c7d-8e5f-1a2b3c4d5e6f',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Transaction created.',
    type: TransactionResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, or `categoryId` does not exist / belongs to another user.',
    type: ErrorResponseDto,
  })
  async create(
    @CurrentUser() user: { id: string; email: string },
    @Body() createTransactionDto: CreateTransactionDto,
  ): Promise<{ data: Transaction }> {
    const transaction = await this.transactionsService.create(
      user.id,
      createTransactionDto,
    );
    return { data: transaction };
  }

  @Get()
  @ApiOperation({
    summary: 'List transactions (paginated, filterable)',
    description: [
      'Returns one page of the authenticated user’s transactions, ordered by `date` descending, plus a `meta` block with the pagination counters.',
      '',
      'All filters combine with AND and are optional:',
      '- `type` — only inflows or only outflows',
      '- `categoryId` — only one category',
      '- `startDate` / `endDate` — inclusive date window',
      '',
      'Examples:',
      '- `GET /transactions?page=1&limit=10`',
      '- `GET /transactions?type=SAIDA&startDate=2026-08-01&endDate=2026-08-31`',
      '- `GET /transactions?categoryId=3fa85f64-5717-4562-b3fc-2c963f66afa6&limit=50`',
    ].join('\n'),
  })
  @ApiOkResponse({
    description: 'Page of transactions plus pagination metadata.',
    type: TransactionListResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'A query parameter is invalid (e.g. `limit=200`, malformed date, unknown parameter).',
    type: ErrorResponseDto,
  })
  async findAll(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: QueryTransactionsDto,
  ): Promise<{
    data: Transaction[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const result = await this.transactionsService.findAll(user.id, query);
    return {
      data: result.data,
      meta: result.meta,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one transaction' })
  @ApiParam(TRANSACTION_ID_PARAM)
  @ApiOkResponse({
    description: 'Transaction details.',
    type: TransactionResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No transaction with this id belongs to the authenticated user.',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<{ data: Transaction }> {
    const transaction = await this.transactionsService.findOne(user.id, id);
    return { data: transaction };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a transaction',
    description: 'Partial update — send only the fields you want to change.',
  })
  @ApiParam(TRANSACTION_ID_PARAM)
  @ApiBody({
    type: UpdateTransactionDto,
    examples: {
      fixAmount: {
        summary: 'Correct the amount',
        value: { amount: 99.9 },
      },
      recategorise: {
        summary: 'Move to another category',
        value: { categoryId: '8c1f3d2e-9a4b-4c7d-8e5f-1a2b3c4d5e6f' },
      },
      fullUpdate: {
        summary: 'Rewrite every field',
        value: {
          description: 'Supermarket (corrected)',
          amount: 131.75,
          type: 'SAIDA',
          date: '2026-08-06',
          categoryId: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Transaction updated.',
    type: TransactionResponseDto,
  })
  @ApiNotFoundResponse({
    description:
      'No transaction with this id belongs to the authenticated user.',
    type: ErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Validation failed, or the new `categoryId` does not belong to the authenticated user.',
    type: ErrorResponseDto,
  })
  async update(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto,
  ): Promise<{ data: Transaction }> {
    const transaction = await this.transactionsService.update(
      user.id,
      id,
      updateTransactionDto,
    );
    return { data: transaction };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a transaction' })
  @ApiParam(TRANSACTION_ID_PARAM)
  @ApiNoContentResponse({ description: 'Transaction deleted; empty body.' })
  @ApiNotFoundResponse({
    description:
      'No transaction with this id belongs to the authenticated user.',
    type: ErrorResponseDto,
  })
  async remove(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<void> {
    await this.transactionsService.remove(user.id, id);
  }
}
