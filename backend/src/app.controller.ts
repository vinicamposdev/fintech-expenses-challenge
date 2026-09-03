import { Controller, Get, Post, Body } from '@nestjs/common';
import {
  ApiExcludeEndpoint,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { TestValidationDto } from './common/dtos/test.dto.js';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness check',
    description: 'Returns a plain greeting — useful to confirm the API is up.',
  })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: { data: { type: 'string', example: 'Hello World!' } },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-validation')
  @ApiExcludeEndpoint()
  testValidation(@Body() dto: TestValidationDto): {
    success: boolean;
    data: TestValidationDto;
  } {
    return {
      success: true,
      data: dto,
    };
  }
}
