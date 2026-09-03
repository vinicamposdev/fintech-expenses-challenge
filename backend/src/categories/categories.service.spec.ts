/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';

type MockRepository = any;

describe('CategoriesService', () => {
  let service: CategoriesService;
  let categoriesRepository: MockRepository;

  const userId = 'user-123';
  const otherUserId = 'user-456';

  const mockCategory = {
    id: 'category-123',
    name: 'Groceries',
    description: 'Grocery shopping',
    userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            create: vi.fn(),
            save: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            remove: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    categoriesRepository = module.get(getRepositoryToken(Category));
  });

  describe('create', () => {
    it('should create a category for the user', async () => {
      const createCategoryDto: CreateCategoryDto = {
        name: 'Groceries',
        description: 'Grocery shopping',
      };

      categoriesRepository.create.mockReturnValueOnce(mockCategory);
      categoriesRepository.save.mockResolvedValueOnce(mockCategory);

      const result = await service.create(userId, createCategoryDto);

      expect(result).toBe(mockCategory);
      expect(categoriesRepository.create).toHaveBeenCalledWith({
        ...createCategoryDto,
        userId,
      });
    });
  });

  describe('findAll', () => {
    it('should return all categories for the user', async () => {
      const categories = [mockCategory];
      categoriesRepository.find.mockResolvedValueOnce(categories);

      const result = await service.findAll(userId);

      expect(result).toEqual(categories);
      expect(categoriesRepository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should find a category owned by the user', async () => {
      categoriesRepository.findOne.mockResolvedValueOnce(mockCategory);

      const result = await service.findOne(userId, mockCategory.id);

      expect(result).toEqual(mockCategory);
      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId },
      });
    });

    it('should throw NotFoundException if category not found', async () => {
      categoriesRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findOne(userId, 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if category belongs to another user', async () => {
      categoriesRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.findOne(otherUserId, mockCategory.id),
      ).rejects.toThrow(NotFoundException);

      expect(categoriesRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockCategory.id, userId: otherUserId },
      });
    });
  });

  describe('update', () => {
    it('should update category owned by the user', async () => {
      const updateCategoryDto: UpdateCategoryDto = {
        name: 'Updated Groceries',
      };

      const updatedCategory = { ...mockCategory, ...updateCategoryDto };

      categoriesRepository.findOne.mockResolvedValueOnce(mockCategory);
      categoriesRepository.save.mockResolvedValueOnce(updatedCategory);

      const result = await service.update(
        userId,
        mockCategory.id,
        updateCategoryDto,
      );

      expect(result).toEqual(updatedCategory);
    });

    it('should throw NotFoundException if category belongs to another user', async () => {
      const updateCategoryDto: UpdateCategoryDto = { name: 'Updated' };

      categoriesRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update(otherUserId, mockCategory.id, updateCategoryDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove category owned by the user', async () => {
      categoriesRepository.findOne.mockResolvedValueOnce(mockCategory);
      categoriesRepository.remove.mockResolvedValueOnce(undefined);

      await service.remove(userId, mockCategory.id);

      expect(categoriesRepository.remove).toHaveBeenCalledWith(mockCategory);
    });

    it('should throw NotFoundException if category belongs to another user', async () => {
      categoriesRepository.findOne.mockResolvedValueOnce(null);

      await expect(
        service.remove(otherUserId, mockCategory.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
