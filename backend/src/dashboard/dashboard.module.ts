import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
