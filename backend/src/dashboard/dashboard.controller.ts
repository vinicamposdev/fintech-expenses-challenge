import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardService, DashboardSummary } from './dashboard.service.js';
import { QueryDashboardDto } from './dtos/query-dashboard.dto.js';
import { DashboardResponseDto } from './dtos/dashboard-response.dto.js';
import { ErrorResponseDto } from '../common/dtos/error-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('dashboard')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Financial summary for the authenticated user',
    description: [
      'Aggregates the user’s transactions into four numbers:',
      '- `balance` — all-time inflow minus outflow, **ignores** the date filter',
      '- `totalEntrada` / `totalSaida` — sums inside the requested period',
      '- `topCategories` — the 3 categories with the highest outflow in the period',
      '',
      'Examples:',
      '- `GET /dashboard` — no filter, period = all time',
      '- `GET /dashboard?startDate=2026-08-01&endDate=2026-08-31` — August only',
      '- `GET /dashboard?startDate=2026-08-01` — from August 1st onwards',
    ].join('\n'),
  })
  @ApiOkResponse({
    description: 'Dashboard summary with balance and top categories.',
    type: DashboardResponseDto,
  })
  @ApiBadRequestResponse({
    description: '`startDate` or `endDate` is not a valid ISO-8601 date.',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Missing, expired or invalid bearer token.',
    type: ErrorResponseDto,
  })
  async getDashboard(
    @CurrentUser() user: { id: string; email: string },
    @Query() query: QueryDashboardDto,
  ): Promise<{ data: DashboardSummary }> {
    const dashboard = await this.dashboardService.getDashboard(user.id, query);
    return { data: dashboard };
  }
}
