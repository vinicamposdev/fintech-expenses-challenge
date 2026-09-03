/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

type MockRepository = any;

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: MockRepository;

  const mockUser = {
    id: '123',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  describe('getUserProfile', () => {
    it('should return user profile without password hash', async () => {
      usersRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.getUserProfile(mockUser.id);

      expect(result).toBeDefined();
      if (result) {
        expect(result.id).toBe(mockUser.id);
        expect(result.name).toBe(mockUser.name);
        expect(result.email).toBe(mockUser.email);
      }
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it('should return null if user not found', async () => {
      usersRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.getUserProfile('invalid-id');

      expect(result).toBeNull();
    });
  });
});
