import { Product } from '../../models/Product';
import { ProductVersion } from '../../models/ProductVersion';
import { logger } from '../../utils/logger';

/**
 * Create an immutable version snapshot of a product.
 * Updates Product.currentVersion after creating the version record.
 */
export async function createProductVersion(
  productId: string,
  changedBy?: string,
  changeNote?: string,
  reviewId?: string,
): Promise<InstanceType<typeof ProductVersion>> {
  const product = await Product.findById(productId).lean();
  if (!product) throw new Error(`Product ${productId} not found for versioning`);

  // Get the latest version number
  const latest = await ProductVersion.findOne({ productId })
    .sort({ version: -1 })
    .select('version')
    .lean();

  const nextVersion = ((latest as { version?: number })?.version ?? 0) + 1;

  const versionRecord = await ProductVersion.create({
    productId,
    version: nextVersion,
    snapshot: product,
    changedBy,
    changeNote,
    ...(reviewId && { reviewId }),
  });

  // Update product's currentVersion pointer
  await Product.findByIdAndUpdate(productId, { currentVersion: versionRecord._id });

  logger.info({ productId, version: nextVersion }, 'Product version created');
  return versionRecord;
}

/**
 * Get full version history for a product (newest first).
 */
export async function getVersionHistory(productId: string): Promise<unknown[]> {
  return ProductVersion.find({ productId }).sort({ version: -1 }).lean();
}

/**
 * Get a specific version by version number.
 */
export async function getVersion(
  productId: string,
  version: number,
): Promise<unknown | null> {
  return ProductVersion.findOne({ productId, version }).lean();
}
