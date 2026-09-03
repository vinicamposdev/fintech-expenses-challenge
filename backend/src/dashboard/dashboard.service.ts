/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity.js';
import { QueryDashboardDto } from './dtos/query-dashboard.dto.js';

export interface TopCategory {
  categoryId: string;
  categoryName: string;
  totalOutflow: number;
}

export interface DashboardSummary {
  balance: number;
  totalEntrada: number;
  totalSaida: number;
  topCategories: TopCategory[];
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
  ) {}

  async getDashboard(
    userId: string,
    query: QueryDashboardDto,
  ): Promise<DashboardSummary> {
    // Calculate all-time balance (unaffected by date filter)
    const balance = await this.calculateBalance(userId);

    // Calculate period totals (ENTRADA and SAIDA within date range)
    const periodTotals = await this.calculatePeriodTotals(userId, query);

    // Get top 3 categories by outflow within the period
    const topCategories = await this.getTopCategoriesByOutflow(userId, query);

    return {
      balance,
      totalEntrada: periodTotals.totalEntrada,
      totalSaida: periodTotals.totalSaida,
      topCategories,
    };
  }

  private async calculateBalance(userId: string): Promise<number> {
    // All-time balance: sum all ENTRADA minus sum all SAIDA
    const result = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .select(
        `COALESCE(SUM(CASE WHEN transaction.type = '${TransactionType.ENTRADA}' THEN transaction.amount ELSE 0 END), 0) -
         COALESCE(SUM(CASE WHEN transaction.type = '${TransactionType.SAIDA}' THEN transaction.amount ELSE 0 END), 0)`,
        'balance',
      )
      .where('transaction.userId = :userId', { userId })
      .getRawOne();

    return parseFloat(result.balance) || 0;
  }

  private async calculatePeriodTotals(
    userId: string,
    query: QueryDashboardDto,
  ): Promise<{ totalEntrada: number; totalSaida: number }> {
    const queryBuilder = this.transactionsRepository
      .createQueryBuilder('transaction')
      .select('transaction.type', 'type')
      .addSelect('SUM(transaction.amount)', 'total')
      .where('transaction.userId = :userId', { userId })
      .groupBy('transaction.type');

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

    const results = await queryBuilder.getRawMany();

    let totalEntrada = 0;
    let totalSaida = 0;

    for (const row of results) {
      const amount = parseFloat(row.total) || 0;
      if (row.type === TransactionType.ENTRADA) {
        totalEntrada = amount;
      } else if (row.type === TransactionType.SAIDA) {
        totalSaida = amount;
      }
    }

    return { totalEntrada, totalSaida };
  }

  private async getTopCategoriesByOutflow(
    userId: string,
    query: QueryDashboardDto,
  ): Promise<TopCategory[]> {
    // Raw SQL for top 3 categories by outflow with JOIN to get category names
    // Using parameterized query for safety
    const sql = `
      SELECT
        c.id as "categoryId",
        c.name as "categoryName",
        COALESCE(SUM(t.amount), 0) as "totalOutflow"
      FROM categories c
      LEFT JOIN transactions t ON c.id = t."categoryId"
        AND t."userId" = $1
        AND t.type = $2
        ${query.startDate ? 'AND t.date >= $3' : ''}
        ${query.endDate ? `AND t.date <= $${query.startDate ? 4 : 3}` : ''}
      WHERE c."userId" = $1
      GROUP BY c.id, c.name
      ORDER BY "totalOutflow" DESC
      LIMIT 3
    `;

    const params: any[] = [userId, TransactionType.SAIDA];
    if (query.startDate) {
      params.push(new Date(query.startDate));
    }
    if (query.endDate) {
      params.push(new Date(query.endDate));
    }

    const results = await this.transactionsRepository.query(sql, params);

    return results.map((row: any) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      totalOutflow: parseFloat(row.totalOutflow) || 0,
    }));
  }
}
