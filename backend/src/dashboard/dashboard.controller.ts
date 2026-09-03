import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { DashboardService, DashboardSummary } from './dashboard.service.js';
import { QueryDashboardDto } from './dtos/query-dashboard.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary with balance and top categories',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getDashboard(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: QueryDashboardDto,
  ): Promise<{ data: DashboardSummary }> {
    const dashboard = await this.dashboardService.getDashboard(user.id, query);
    return { data: dashboard };
  }
}
