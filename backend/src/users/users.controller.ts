import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService, UserProfile } from './users.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getCurrentUser(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<{ data: UserProfile }> {
    // User is guaranteed to exist from JWT validation, but we still fetch the latest data
    const userProfile = await this.usersService.getUserProfile(user.id);
    // This should never be null in normal circumstances, but TypeScript requires us to handle it

    return { data: userProfile! };
  }
}
