/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { Transaction, TransactionType } from './entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { CreateTransactionDto } from './dtos/create-transaction.dto.js';
import { QueryTransactionsDto } from './dtos/query-transactions.dto.js';

type MockRepository = any;

describe('TransactionsService', () => {
  let service: TransactionsService;
  let transactionsRepository: MockRepository;
  let categoriesRepository: MockRepository;

  const userId = 'user-123';
  const otherUserId = 'user-456';
  const categoryId = 'category-123';
  const otherCategoryId = 'category-456';

  const mockCategory = {
    id: categoryId,
    name: 'Groceries',
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'transaction-123',
    description: 'Weekly groceries',
    amount: 50.0,
    type: TransactionType.SAIDA,
    date: new Date('2026-08-15'),
    categoryId,
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    transactionsRepository = module.get(getRepositoryToken(Transaction));
    categoriesRepository = module.get(getRepositoryToken(Category));
  });

  describe('create', () => {
    it('should create transaction with valid category', async () => {
      const createTransactionDto: CreateTransactionDto = {
        description: 'Weekly groceries',
        amount: 50.0,
        type: TransactionType.SAIDA,
        date: '2026-08-15',
        categoryId,
      };

      categoriesRepository.findOne.mockResolvedValueOnce(mockCategory);
      transactionsRepository.create.mockReturnValueOnce(mockTransaction);
      transactionsRepository.save.mockResolvedValueOnce(mockTransaction);

      const result = await service.create(userId, createTransactionDto);

      expect(result).toEqual(mockTransaction);
      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId, userId },
      });
    });

    it('should reject transaction with non-existent category', async () => {
      const createTransactionDto: CreateTransactionDto = {
        description: 'Weekly groceries',
        amount: 50.0,
        type: TransactionType.SAIDA,
        date: '2026-08-15',
        categoryId,
      };

      categoriesRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create(userId, createTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject transaction with category from another user', async () => {
      const createTransactionDto: CreateTransactionDto = {
        description: 'Weekly groceries',
        amount: 50.0,
        type: TransactionType.SAIDA,
        date: '2026-08-15',
        categoryId: otherCategoryId,
      };

      categoriesRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.create(userId, createTransactionDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll with pagination', () => {
    it('should return paginated transactions with default pagination', async () => {
      const query: QueryTransactionsDto = {};

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValueOnce([[mockTransaction], 1]),
      };

      transactionsRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder,
      );

      const result = await service.findAll(userId, query);

      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(result.data).toEqual([mockTransaction]);
    });

    it('should calculate correct pagination for multiple pages', async () => {
      const query: QueryTransactionsDto = { page: 2, limit: 5 };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValueOnce([[], 23]),
      };

      transactionsRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder,
      );

      const result = await service.findAll(userId, query);

      expect(result.meta).toEqual({
        total: 23,
        page: 2,
        limit: 5,
        totalPages: 5,
      });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(5);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findAll with filters', () => {
    it('should filter by type', async () => {
      const query: QueryTransactionsDto = { type: TransactionType.SAIDA };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValueOnce([[mockTransaction], 1]),
      };

      transactionsRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder,
      );

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.type = :type',
        { type: TransactionType.SAIDA },
      );
    });

    it('should filter by categoryId', async () => {
      const query: QueryTransactionsDto = { categoryId };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValueOnce([[mockTransaction], 1]),
      };

      transactionsRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder,
      );

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'transaction.categoryId = :categoryId',
        { categoryId },
      );
    });

    it('should filter by date range', async () => {
      const query: QueryTransactionsDto = {
        startDate: '2026-08-01',
        endDate: '2026-08-31',
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValueOnce([[mockTransaction], 1]),
      };

      transactionsRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder,
      );

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(2);
    });

    it('should compose multiple filters with AND logic', async () => {
      const query: QueryTransactionsDto = {
        type: TransactionType.SAIDA,
        categoryId,
        startDate: '2026-08-01',
      };

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest
          .fn()
          .mockResolvedValueOnce([[mockTransaction], 1]),
      };

      transactionsRepository.createQueryBuilder.mockReturnValueOnce(
        mockQueryBuilder,
      );

      await service.findAll(userId, query);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(3);
    });
  });

  describe('findOne', () => {
    it('should find transaction owned by user', async () => {
      transactionsRepository.findOne.mockResolvedValueOnce(mockTransaction);

      const result = await service.findOne(userId, mockTransaction.id);

      expect(result).toEqual(mockTransaction);
      expect(transactionsRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTransaction.id, userId },
      });
    });

    it('should throw NotFoundException if transaction not found', async () => {
      transactionsRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(userId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if transaction belongs to another user', async () => {
      transactionsRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.findOne(otherUserId, mockTransaction.id),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove transaction owned by user', async () => {
      transactionsRepository.findOne.mockResolvedValueOnce(mockTransaction);
      transactionsRepository.remove.mockResolvedValueOnce(undefined);

      await service.remove(userId, mockTransaction.id);

      expect(transactionsRepository.remove).toHaveBeenCalledWith(
        mockTransaction,
      );
    });

    it('should throw NotFoundException if transaction belongs to another user', async () => {
      transactionsRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.remove(otherUserId, mockTransaction.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
