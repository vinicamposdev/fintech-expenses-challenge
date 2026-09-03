import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto.js';

/**
 * Every field is optional — send only what changes.
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
