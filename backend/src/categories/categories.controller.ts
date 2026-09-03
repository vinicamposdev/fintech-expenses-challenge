import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('categories')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: 'Category created',
  })
  async create(
    @CurrentUser() user: { id: string; email: string },
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<{ data: Category }> {
    const category = await this.categoriesService.create(
      user.id,
      createCategoryDto,
    );
    return { data: category };
  }

  @Get()
  @ApiResponse({
    status: 200,
    description: 'List of categories',
  })
  async findAll(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<{ data: Category[] }> {
    const categories = await this.categoriesService.findAll(user.id);
    return { data: categories };
  }

  @Get(':id')
  @ApiResponse({
    status: 200,
    description: 'Category details',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async findOne(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<{ data: Category }> {
    const category = await this.categoriesService.findOne(user.id, id);
    return { data: category };
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: 'Category updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async update(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<{ data: Category }> {
    const category = await this.categoriesService.update(
      user.id,
      id,
      updateCategoryDto,
    );
    return { data: category };
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiResponse({
    status: 204,
    description: 'Category deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async remove(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<void> {
    await this.categoriesService.remove(user.id, id);
  }
}
