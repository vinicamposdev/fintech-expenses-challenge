import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class QueryDashboardDto {
  @ApiPropertyOptional({
    description:
      'Inclusive start of the reporting period, ISO-8601. Affects `totalEntrada`, `totalSaida` and `topCategories` — `balance` is always all-time.',
    example: '2026-08-01',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Inclusive end of the reporting period, ISO-8601.',
    example: '2026-08-31',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
