/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DashboardService } from './dashboard.service.js';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity.js';
import { QueryDashboardDto } from './dtos/query-dashboard.dto.js';

type MockRepository = any;

describe('DashboardService', () => {
  let service: DashboardService;
  let transactionsRepository: MockRepository;

  const userId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            createQueryBuilder: vi.fn(),
            query: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    transactionsRepository = module.get(getRepositoryToken(Transaction));
  });

  describe('getDashboard - Balance Calculation', () => {
    it('should calculate correct balance from all-time transactions', async () => {
      const query: QueryDashboardDto = {};

      // Mock balance query
      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '5000' }),
      };

      // Mock period totals query
      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([
          { type: TransactionType.ENTRADA, total: '10000' },
          { type: TransactionType.SAIDA, total: '5000' },
        ]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      // Mock top categories query
      transactionsRepository.query.mockResolvedValueOnce([
        { categoryId: 'cat-1', categoryName: 'Food', totalOutflow: '2000' },
        {
          categoryId: 'cat-2',
          categoryName: 'Transport',
          totalOutflow: '1500',
        },
        {
          categoryId: 'cat-3',
          categoryName: 'Utilities',
          totalOutflow: '1000',
        },
      ]);

      const result = await service.getDashboard(userId, query);

      expect(result.balance).toBe(5000);
      expect(result.totalEntrada).toBe(10000);
      expect(result.totalSaida).toBe(5000);
    });

    it('should calculate balance with zero transactions', async () => {
      const query: QueryDashboardDto = {};

      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '0' }),
      };

      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      transactionsRepository.query.mockResolvedValueOnce([]);

      const result = await service.getDashboard(userId, query);

      expect(result.balance).toBe(0);
      expect(result.totalEntrada).toBe(0);
      expect(result.totalSaida).toBe(0);
      expect(result.topCategories).toEqual([]);
    });
  });

  describe('getDashboard - Period Filtering', () => {
    it('should apply date filters to period totals', async () => {
      const query: QueryDashboardDto = {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };

      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '5000' }),
      };

      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([
          { type: TransactionType.ENTRADA, total: '3000' },
          { type: TransactionType.SAIDA, total: '1500' },
        ]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      transactionsRepository.query.mockResolvedValueOnce([]);

      await service.getDashboard(userId, query);

      // Verify date filters were applied to period query
      expect(periodQueryBuilder.andWhere).toHaveBeenCalled();
    });

    it('should not apply date filters to balance calculation', async () => {
      const query: QueryDashboardDto = {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };

      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '10000' }),
      };

      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      transactionsRepository.query.mockResolvedValueOnce([]);

      const result = await service.getDashboard(userId, query);

      // Balance should be all-time, not affected by date filter
      expect(result.balance).toBe(10000);
    });
  });

  describe('getDashboard - Top Categories', () => {
    it('should return top 3 categories ordered by outflow', async () => {
      const query: QueryDashboardDto = {};

      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '5000' }),
      };

      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      transactionsRepository.query.mockResolvedValueOnce([
        { categoryId: 'cat-1', categoryName: 'Food', totalOutflow: '3000' },
        {
          categoryId: 'cat-2',
          categoryName: 'Transport',
          totalOutflow: '1500',
        },
        { categoryId: 'cat-3', categoryName: 'Utilities', totalOutflow: '500' },
      ]);

      const result = await service.getDashboard(userId, query);

      expect(result.topCategories).toHaveLength(3);
      expect(result.topCategories[0].totalOutflow).toBe(3000);
      expect(result.topCategories[1].totalOutflow).toBe(1500);
      expect(result.topCategories[2].totalOutflow).toBe(500);
    });

    it('should return fewer than 3 categories if not enough data', async () => {
      const query: QueryDashboardDto = {};

      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '1000' }),
      };

      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      transactionsRepository.query.mockResolvedValueOnce([
        { categoryId: 'cat-1', categoryName: 'Food', totalOutflow: '1000' },
      ]);

      const result = await service.getDashboard(userId, query);

      expect(result.topCategories).toHaveLength(1);
      expect(result.topCategories[0].categoryName).toBe('Food');
    });

    it('should apply date filters to top categories query', async () => {
      const query: QueryDashboardDto = {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };

      const balanceQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        getRawOne: vi.fn().mockResolvedValueOnce({ balance: '5000' }),
      };

      const periodQueryBuilder = {
        createQueryBuilder: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        addSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        groupBy: vi.fn().mockReturnThis(),
        getRawMany: vi.fn().mockResolvedValueOnce([]),
      };

      transactionsRepository.createQueryBuilder
        .mockReturnValueOnce(balanceQueryBuilder)
        .mockReturnValueOnce(periodQueryBuilder);

      transactionsRepository.query.mockResolvedValueOnce([]);

      await service.getDashboard(userId, query);

      // Verify SQL query was called with date parameters
      expect(transactionsRepository.query).toHaveBeenCalled();
      const sqlCall = transactionsRepository.query.mock.calls[0];
      expect(sqlCall[0]).toContain('transactions');
      expect(sqlCall[1].length).toBeGreaterThan(1); // Should have userId and dates
    });
  });
});
