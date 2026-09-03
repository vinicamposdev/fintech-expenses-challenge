import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transactions/entities/transaction.entity.js';
import { DashboardService } from './dashboard.service.js';
import { DashboardController } from './dashboard.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
