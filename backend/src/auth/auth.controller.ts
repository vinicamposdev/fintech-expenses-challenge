import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service.js';
import { RegisterDto } from './dtos/register.dto.js';
import { LoginDto } from './dtos/login.dto.js';
import { AuthResponseDto } from './dtos/auth-response.dto.js';
import { ErrorResponseDto } from '../common/dtos/error-response.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Create an account and get a token',
    description:
      'Creates a user and immediately returns a 24h JWT, so registration alone is enough to start calling the protected endpoints. Copy `data.accessToken` into **Authorize** at the top of this page.',
  })
  @ApiBody({
    type: RegisterDto,
    examples: {
      newUser: {
        summary: 'New account',
        description: 'Minimum valid payload — password must have 6+ chars.',
        value: {
          name: 'Ana Souza',
          email: 'ana.souza@example.com',
          password: 'sup3rsecret',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'User registered; token issued.',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Email already registered, or payload failed validation.',
    type: ErrorResponseDto,
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({
    summary: 'Exchange credentials for a token',
    description:
      'Returns a JWT valid for 24 hours. The seeded demo account (`npm run seed`) is `demo@example.com` / `password123`.',
  })
  @ApiBody({
    type: LoginDto,
    examples: {
      seededDemoUser: {
        summary: 'Seeded demo user',
        description: 'Works right after running `npm run seed`.',
        value: { email: 'demo@example.com', password: 'password123' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Login successful; token issued (the endpoint answers 201).',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unknown email or wrong password.',
    type: ErrorResponseDto,
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }
}
