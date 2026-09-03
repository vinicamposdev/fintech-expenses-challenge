import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service.js';
import { TestValidationDto } from './common/dtos/test.dto.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('test-validation')
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
