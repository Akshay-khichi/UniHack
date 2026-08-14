import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { Product } from '../src/models/Product';
import { logger } from '../src/utils/logger';

/**
 * Seed the HC-5020 demo product for hackathon demo.
 */
async function seed(): Promise<void> {
  if (!env.MONGODB_URI) {
    logger.error('MONGODB_URI not set — cannot seed');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB for seeding');

  // HC-5020 Demo Product
  const existing = await Product.findOne({ sku: 'HC-5020' });
  if (existing) {
    logger.info('HC-5020 already exists — skipping');
  } else {
    await Product.create({
      sku: 'HC-5020',
      name: 'Hydraulic Cylinder HC-5020',
      brand: 'HydroTech',
      category: 'Hydraulic Cylinder',
      description: 'Double-acting hydraulic cylinder for industrial applications. This product demonstrates the SpecTrace conflict detection: Technical Datasheet specifies 210 bar max pressure, Marketing Document claims 250 bar.',
      status: 'DRAFT',
    });
    logger.info('HC-5020 created successfully');
  }

  await mongoose.disconnect();
  logger.info('Seeding complete');
}

seed().catch((err) => {
  logger.error({ err }, 'Seed failed');
  process.exit(1);
});
