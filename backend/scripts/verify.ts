import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { Product } from '../src/models/Product';
import { CategoryKnowledge } from '../src/models/CategoryKnowledge';
import { logger } from '../src/utils/logger';

async function verify(): Promise<void> {
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set — skipping DB checks');
  } else {
    await mongoose.connect(env.MONGODB_URI);
    const hc5020 = await Product.findOne({ sku: 'HC-5020' });
    const knowledgeCount = await CategoryKnowledge.countDocuments({ category: 'Hydraulic Cylinder' });

    if (!hc5020) {
      logger.error('HC-5020 not found — run npm run seed first');
      process.exit(1);
    }
    if (knowledgeCount === 0) {
      logger.error('No category knowledge found — run npm run seed:knowledge first');
      process.exit(1);
    }

    logger.info({ sku: hc5020.sku, knowledgeCount }, 'Database verification passed');
    await mongoose.disconnect();
  }

  // Config checks
  const missing: string[] = [];
  if (!env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!env.CLOUDINARY_CLOUD_NAME) missing.push('CLOUDINARY_CLOUD_NAME');
  if (!env.CLOUDINARY_API_KEY) missing.push('CLOUDINARY_API_KEY');
  if (!env.CLOUDINARY_API_SECRET) missing.push('CLOUDINARY_API_SECRET');
  if (!env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');

  if (missing.length > 0) {
    logger.warn({ missing }, 'Some env vars not configured — external services will be unavailable');
  } else {
    logger.info('All environment variables configured');
  }

  logger.info('Verification complete');
}

verify().catch((err) => {
  logger.error({ err }, 'Verification failed');
  process.exit(1);
});
