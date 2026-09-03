import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './entities/transaction.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import { TransactionsService } from './transactions.service.js';
import { TransactionsController } from './transactions.controller.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, Category]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [TransactionsService],
  controllers: [TransactionsController],
  exports: [TransactionsService],
})
export class TransactionsModule {}
