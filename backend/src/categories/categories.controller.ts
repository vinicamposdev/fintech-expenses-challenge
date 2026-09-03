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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dtos/create-category.dto.js';
import { UpdateCategoryDto } from './dtos/update-category.dto.js';
import {
  CategoryResponseDto,
  CategoryListResponseDto,
} from './dtos/category-response.dto.js';
import { ErrorResponseDto } from '../common/dtos/error-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

const CATEGORY_ID_PARAM = {
  name: 'id',
  description: 'UUID of a category owned by the authenticated user.',
  format: 'uuid',
  example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
} as const;

@ApiTags('categories')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: 'Missing, expired or invalid bearer token.',
  type: ErrorResponseDto,
})
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a category',
    description:
      'Categories are per-user; the owner is taken from the token, never from the body. Create one before creating transactions — `POST /transactions` requires an existing `categoryId`.',
  })
  @ApiBody({
    type: CreateCategoryDto,
    examples: {
      expense: {
        summary: 'Expense category',
        value: {
          name: 'Alimentação',
          description: 'Groceries, restaurants and coffee',
        },
      },
      nameOnly: {
        summary: 'Name only',
        description: '`description` is optional.',
        value: { name: 'Transporte' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Category created.',
    type: CategoryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Payload failed validation (e.g. empty `name`).',
    type: ErrorResponseDto,
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
  @ApiOperation({
    summary: 'List categories',
    description:
      'Returns every category of the authenticated user, newest first. Not paginated.',
  })
  @ApiOkResponse({
    description: 'List of categories.',
    type: CategoryListResponseDto,
  })
  async findAll(
    @CurrentUser() user: { id: string; email: string },
  ): Promise<{ data: Category[] }> {
    const categories = await this.categoriesService.findAll(user.id);
    return { data: categories };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one category' })
  @ApiParam(CATEGORY_ID_PARAM)
  @ApiOkResponse({
    description: 'Category details.',
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No category with this id belongs to the authenticated user.',
    type: ErrorResponseDto,
  })
  async findOne(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<{ data: Category }> {
    const category = await this.categoriesService.findOne(user.id, id);
    return { data: category };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a category',
    description: 'Partial update — send only the fields you want to change.',
  })
  @ApiParam(CATEGORY_ID_PARAM)
  @ApiBody({
    type: UpdateCategoryDto,
    examples: {
      renameOnly: {
        summary: 'Rename',
        value: { name: 'Alimentação e Delivery' },
      },
      descriptionOnly: {
        summary: 'Change the description',
        value: { description: 'Everything food related' },
      },
    },
  })
  @ApiOkResponse({
    description: 'Category updated.',
    type: CategoryResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No category with this id belongs to the authenticated user.',
    type: ErrorResponseDto,
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
  @ApiOperation({
    summary: 'Delete a category',
    description:
      'Deleting a category that still has transactions is rejected by the database (`onDelete: RESTRICT`) — delete or re-categorise its transactions first.',
  })
  @ApiParam(CATEGORY_ID_PARAM)
  @ApiNoContentResponse({ description: 'Category deleted; empty body.' })
  @ApiNotFoundResponse({
    description: 'No category with this id belongs to the authenticated user.',
    type: ErrorResponseDto,
  })
  async remove(
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ): Promise<void> {
    await this.categoriesService.remove(user.id, id);
  }
}
