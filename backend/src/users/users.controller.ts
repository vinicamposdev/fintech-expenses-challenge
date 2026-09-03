import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UsersService, UserProfile } from './users.service.js';
import { UserProfileResponseDto } from './dtos/user-profile.dto.js';
import { ErrorResponseDto } from '../common/dtos/error-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Profile of the token owner',
    description:
      'Resolves the user from the bearer token and returns the stored profile. Handy to check that a token is still valid. The password hash is never returned.',
  })
  @ApiOkResponse({
    description: 'Current user profile.',
    type: UserProfileResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired or invalid bearer token.',
    type: ErrorResponseDto,
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
