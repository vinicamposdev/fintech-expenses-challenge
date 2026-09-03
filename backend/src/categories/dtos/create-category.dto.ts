import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    description:
      'Category label shown in the UI. Scoped to the authenticated user.',
    example: 'Alimentação',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Free-text note describing what belongs in this category.',
    example: 'Groceries, restaurants and coffee',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
