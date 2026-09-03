import { AppDataSource } from './data-source.js';
import { User } from '../users/entities/user.entity.js';
import { Category } from '../categories/entities/category.entity.js';
import {
  Transaction,
  TransactionType,
} from '../transactions/entities/transaction.entity.js';
import * as bcrypt from 'bcrypt';

async function seed(): Promise<void> {
  await AppDataSource.initialize();

  const userRepository = AppDataSource.getRepository(User);
  const categoryRepository = AppDataSource.getRepository(Category);
  const transactionRepository = AppDataSource.getRepository(Transaction);

  const email = 'demo@example.com';
  const existingUser = await userRepository.findOne({ where: { email } });

  if (existingUser) {
    console.log('Demo user already exists. Skipping seed.');
    await AppDataSource.destroy();
    return;
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = userRepository.create({
    name: 'Demo User',
    email,
    passwordHash,
  });

  await userRepository.save(user);
  console.log('Demo user created:', email);

  const categoryNames = [
    'Alimentação',
    'Transporte',
    'Fornecedor',
    'Receita de Cliente',
    'Salário',
  ];

  const categories = await Promise.all(
    categoryNames.map((name) =>
      categoryRepository.save(
        categoryRepository.create({
          name,
          description: `${name} category`,
          userId: user.id,
        }),
      ),
    ),
  );

  console.log('Categories created:', categories.length);

  const transactions = [
    {
      description: 'Coffee shop',
      amount: 5.5,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-01'),
      categoryId: categories[0].id,
    },
    {
      description: 'Taxi ride',
      amount: 25,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-05'),
      categoryId: categories[1].id,
    },
    {
      description: 'Invoice payment',
      amount: 1000,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-10'),
      categoryId: categories[2].id,
    },
    {
      description: 'Client payment',
      amount: 5000,
      type: TransactionType.ENTRADA,
      date: new Date('2026-08-15'),
      categoryId: categories[3].id,
    },
    {
      description: 'Monthly salary',
      amount: 3000,
      type: TransactionType.ENTRADA,
      date: new Date('2026-08-20'),
      categoryId: categories[4].id,
    },
  ];

  await transactionRepository.save(
    transactions.map((t) =>
      transactionRepository.create({
        ...t,
        userId: user.id,
      }),
    ),
  );

  console.log('Transactions created:', transactions.length);
  console.log('Seed completed successfully!');

  await AppDataSource.destroy();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
