import { ApiProperty } from '@nestjs/swagger';

export class TopCategoryDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  categoryId: string;

  @ApiProperty({ example: 'Fornecedor' })
  categoryName: string;

  @ApiProperty({
    description: 'Sum of `SAIDA` amounts in this category within the period.',
    example: 750,
  })
  totalOutflow: number;
}

export class DashboardSummaryDto {
  @ApiProperty({
    description:
      'All-time balance (total inflow minus total outflow). Not affected by `startDate`/`endDate`.',
    example: 10820.5,
  })
  balance: number;

  @ApiProperty({
    description: 'Sum of `ENTRADA` amounts within the period.',
    example: 12000,
  })
  totalEntrada: number;

  @ApiProperty({
    description: 'Sum of `SAIDA` amounts within the period.',
    example: 1179.5,
  })
  totalSaida: number;

  @ApiProperty({
    description: 'Top 3 categories by outflow within the period.',
    type: [TopCategoryDto],
  })
  topCategories: TopCategoryDto[];
}

export class DashboardResponseDto {
  @ApiProperty({ type: DashboardSummaryDto })
  data: DashboardSummaryDto;
}
