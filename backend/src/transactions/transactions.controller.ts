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
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service.js';
import { Transaction } from './entities/transaction.entity.js';
import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { QueryTransactionsDto } from './dtos/query-transactions.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('transactions')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Transaction created',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category or bad request',
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
  @ApiResponse({
    status: 200,
    description: 'List of transactions with pagination',
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
  @ApiResponse({
    status: 200,
    description: 'Transaction details',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async findOne(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<{ data: Transaction }> {
    const transaction = await this.transactionsService.findOne(user.id, id);
    return { data: transaction };
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Transaction updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid category',
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
  @ApiResponse({
    status: 204,
    description: 'Transaction deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async remove(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<void> {
    await this.transactionsService.remove(user.id, id);
  }
}
