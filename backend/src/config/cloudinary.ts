import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let configured = false;

export function configureCloudinary(): void {
  if (configured) return;
  if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
    logger.warn('Cloudinary credentials not set — upload service will be unavailable');
    return;
  }
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  configured = true;
  logger.info('Cloudinary configured');
}

export function isCloudinaryConfigured(): boolean {
  return configured;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  filename: string,
  folder: string = 'spectrace',
  resourceType: 'raw' | 'image' | 'video' = 'raw',
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: `${folder}/${Date.now()}_${sanitizeFilename(filename)}`,
        resource_type: resourceType,
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        if (!result) {
          reject(new Error('Cloudinary returned no result'));
          return;
        }
        resolve(result);
      },
    );
    uploadStream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'raw' | 'image' = 'raw'): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 100);
}
