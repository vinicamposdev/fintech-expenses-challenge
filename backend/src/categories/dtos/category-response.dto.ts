import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  id: string;

  @ApiProperty({ example: 'Alimentação' })
  name: string;

  @ApiProperty({
    nullable: true,
    example: 'Groceries, restaurants and coffee',
  })
  description: string | null;

  @ApiProperty({
    description: 'Owner of the category — always the authenticated user.',
    format: 'uuid',
    example: '9f1b2c3d-4e5f-6a7b-8c9d-0e1f2a3b4c5d',
  })
  userId: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-01T10:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-08-01T10:00:00.000Z' })
  updatedAt: string;
}

export class CategoryResponseDto {
  @ApiProperty({ type: CategoryDto })
  data: CategoryDto;
}

export class CategoryListResponseDto {
  @ApiProperty({
    type: [CategoryDto],
    description: 'Categories of the authenticated user, newest first.',
  })
  data: CategoryDto[];
}
