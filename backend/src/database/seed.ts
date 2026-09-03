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
    // Alimentação transactions
    {
      description: 'Grocery shopping',
      amount: 85.5,
      type: TransactionType.SAIDA,
      date: new Date('2026-07-28'),
      categoryId: categories[0].id,
    },
    {
      description: 'Restaurant dinner',
      amount: 65.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-01'),
      categoryId: categories[0].id,
    },
    {
      description: 'Coffee shop',
      amount: 5.5,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-03'),
      categoryId: categories[0].id,
    },
    {
      description: 'Supermarket',
      amount: 120.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-05'),
      categoryId: categories[0].id,
    },
    // Transporte transactions
    {
      description: 'Uber ride',
      amount: 25.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-02'),
      categoryId: categories[1].id,
    },
    {
      description: 'Taxi to airport',
      amount: 45.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-04'),
      categoryId: categories[1].id,
    },
    {
      description: 'Bus ticket',
      amount: 8.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-06'),
      categoryId: categories[1].id,
    },
    {
      description: 'Gas for car',
      amount: 80.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-08'),
      categoryId: categories[1].id,
    },
    // Fornecedor transactions
    {
      description: 'Office supplies invoice',
      amount: 250.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-07'),
      categoryId: categories[2].id,
    },
    {
      description: 'Software subscription',
      amount: 500.0,
      type: TransactionType.SAIDA,
      date: new Date('2026-08-10'),
      categoryId: categories[2].id,
    },
    // Receita de Cliente transactions (ENTRADA)
    {
      description: 'Project completion payment',
      amount: 3500.0,
      type: TransactionType.ENTRADA,
      date: new Date('2026-08-11'),
      categoryId: categories[3].id,
    },
    {
      description: 'Consulting fee',
      amount: 1500.0,
      type: TransactionType.ENTRADA,
      date: new Date('2026-08-15'),
      categoryId: categories[3].id,
    },
    {
      description: 'Invoice payment received',
      amount: 2000.0,
      type: TransactionType.ENTRADA,
      date: new Date('2026-08-18'),
      categoryId: categories[3].id,
    },
    // Salário transactions (ENTRADA)
    {
      description: 'Monthly salary',
      amount: 5000.0,
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
