import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { UpdateTransactionDto } from './dtos/update-transaction.dto.js';
import { QueryTransactionsDto } from './dtos/query-transactions.dto.js';

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async create(
    userId: string,
    createTransactionDto: CreateTransactionDto,
  ): Promise<Transaction> {
    // Validate that the category belongs to the user
    const category = await this.categoriesRepository.findOne({
      where: { id: createTransactionDto.categoryId, userId },
    });

    if (!category) {
      throw new BadRequestException('Category not found');
    }

    const transaction = this.transactionsRepository.create({
      ...createTransactionDto,
      userId,
      date: new Date(createTransactionDto.date),
    });

    return this.transactionsRepository.save(transaction);
  }

  async findAll(
    userId: string,
    query: QueryTransactionsDto,
  ): Promise<PaginatedResponse<Transaction>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 10));
    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .where('transaction.userId = :userId', { userId })
      .orderBy('transaction.date', 'DESC');

    if (query.type) {
      queryBuilder.andWhere('transaction.type = :type', { type: query.type });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('transaction.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.startDate) {
      queryBuilder.andWhere('transaction.date >= :startDate', {
        startDate: new Date(query.startDate),
      });
    }

    if (query.endDate) {
      queryBuilder.andWhere('transaction.date <= :endDate', {
        endDate: new Date(query.endDate),
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(userId: string, transactionId: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id: transactionId, userId },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async update(
    userId: string,
    transactionId: string,
    updateTransactionDto: UpdateTransactionDto,
  ): Promise<Transaction> {
    const transaction = await this.findOne(userId, transactionId);

    // If categoryId is being updated, validate it belongs to the user
    if (updateTransactionDto.categoryId) {
      const category = await this.categoriesRepository.findOne({
        where: { id: updateTransactionDto.categoryId, userId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    Object.assign(transaction, {
      ...updateTransactionDto,
      ...(updateTransactionDto.date && {
        date: new Date(updateTransactionDto.date),
      }),
    });

    return this.transactionsRepository.save(transaction);
  }

  async remove(userId: string, transactionId: string): Promise<void> {
    const transaction = await this.findOne(userId, transactionId);
    await this.transactionsRepository.remove(transaction);
  }
}
