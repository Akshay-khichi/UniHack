import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { CategoryKnowledge } from '../src/models/CategoryKnowledge';
import { logger } from '../src/utils/logger';

const HYDRAULIC_CYLINDER_KNOWLEDGE = [
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'maximumPressure',
    typicalRange: { min: 100, max: 350, unit: 'bar' },
    description: 'Maximum operating pressure for industrial hydraulic cylinders typically ranges from 100 to 350 bar.',
    embeddingText: 'Hydraulic cylinder maximum operating pressure typical range 100 to 350 bar',
  },
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'boreDiameter',
    typicalRange: { min: 20, max: 500, unit: 'mm' },
    typicalValues: [
      { value: 40, unit: 'mm' },
      { value: 50, unit: 'mm' },
      { value: 63, unit: 'mm' },
      { value: 80, unit: 'mm' },
      { value: 100, unit: 'mm' },
    ],
    description: 'Standard ISO bore diameters for hydraulic cylinders.',
    embeddingText: 'Hydraulic cylinder bore diameter standard ISO sizes 40 50 63 80 100 mm',
  },
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'operatingMedium',
    typicalValues: [
      { value: 'Hydraulic oil ISO VG 46' },
      { value: 'Hydraulic oil ISO VG 32' },
      { value: 'Fire-resistant fluid HFA' },
    ],
    description: 'Typical operating media for industrial hydraulic cylinders.',
    embeddingText: 'Hydraulic cylinder operating medium hydraulic oil fluid compatibility',
  },
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'operatingTemperature',
    typicalRange: { min: -20, max: 80, unit: '°C' },
    description: 'Standard operating temperature range for hydraulic cylinders with NBR seals.',
    embeddingText: 'Hydraulic cylinder operating temperature range -20 to 80 degrees Celsius',
  },
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'sealMaterial',
    typicalValues: [
      { value: 'NBR (Nitrile Butadiene Rubber)' },
      { value: 'PTFE (Polytetrafluoroethylene)' },
      { value: 'FKM (Viton)' },
    ],
    description: 'Common seal materials used in hydraulic cylinders.',
    embeddingText: 'Hydraulic cylinder seal material NBR PTFE Viton FKM',
  },
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'bodyMaterial',
    typicalValues: [
      { value: 'Carbon Steel' },
      { value: 'Stainless Steel 316L' },
      { value: 'Aluminum Alloy' },
    ],
    description: 'Typical body materials for hydraulic cylinders.',
    embeddingText: 'Hydraulic cylinder body material carbon steel stainless aluminum',
  },
  {
    category: 'Hydraulic Cylinder',
    fieldName: 'certifications',
    typicalValues: [
      { value: 'ISO 6020-1' },
      { value: 'ISO 6022' },
      { value: 'CE Marking' },
    ],
    description: 'Common certifications and standards for hydraulic cylinders.',
    embeddingText: 'Hydraulic cylinder certifications ISO 6020 CE marking standards',
  },
];

async function seedKnowledge(): Promise<void> {
  if (!env.MONGODB_URI) {
    logger.error('MONGODB_URI not set — cannot seed');
    process.exit(1);
  }

  await mongoose.connect(env.MONGODB_URI);
  logger.info('Connected to MongoDB for knowledge seeding');

  for (const entry of HYDRAULIC_CYLINDER_KNOWLEDGE) {
    const existing = await CategoryKnowledge.findOne({
      category: entry.category,
      fieldName: entry.fieldName,
    });

    if (existing) {
      logger.info({ category: entry.category, field: entry.fieldName }, 'Knowledge entry exists — skipping');
      continue;
    }

    await CategoryKnowledge.create(entry);
    logger.info({ category: entry.category, field: entry.fieldName }, 'Knowledge entry created');
  }

  await mongoose.disconnect();
  logger.info('Knowledge seeding complete');
}

seedKnowledge().catch((err) => {
  logger.error({ err }, 'Knowledge seed failed');
  process.exit(1);
});
