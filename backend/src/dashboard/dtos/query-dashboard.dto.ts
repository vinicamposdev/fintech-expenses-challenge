import { IsOptional, IsDateString } from 'class-validator';

export class QueryDashboardDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
