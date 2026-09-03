/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { User } from '../users/entities/user.entity.js';
import { RegisterDto } from './dtos/register.dto.js';
import { LoginDto } from './dtos/login.dto.js';

type MockRepository = any;

describe('AuthService', () => {
  let service: AuthService;
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
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-jwt-token'),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(getRepositoryToken(User));
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      usersRepository.findOne.mockResolvedValueOnce(null);
      usersRepository.create.mockReturnValueOnce(mockUser);
      usersRepository.save.mockResolvedValueOnce(mockUser);

      const result = await service.register(registerDto);

      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user.name).toBe(mockUser.name);
      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
    });

    it('should reject duplicate email', async () => {
      const registerDto: RegisterDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      usersRepository.findOne.mockResolvedValueOnce(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      usersRepository.findOne.mockResolvedValueOnce(mockUser);

      const compareSpy = jest.spyOn(bcrypt, 'compare' as never);
      compareSpy.mockResolvedValue(true as never);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.user.id).toBe(mockUser.id);
      expect(result.user.email).toBe(mockUser.email);

      compareSpy.mockRestore();
    });

    it('should reject login with wrong password', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
      };

      usersRepository.findOne.mockResolvedValueOnce(mockUser);

      const compareSpy = jest.spyOn(bcrypt, 'compare' as never);
      compareSpy.mockResolvedValue(false as never);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      compareSpy.mockRestore();
    });

    it('should reject login if user not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      usersRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if found', async () => {
      usersRepository.findOne.mockResolvedValueOnce(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      usersRepository.findOne.mockResolvedValueOnce(null);

      const result = await service.validateUser('invalid-id');

      expect(result).toBeNull();
    });
  });
});
