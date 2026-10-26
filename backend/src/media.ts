import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { HttpError } from './validation.js';

export const MAX_IMAGE_BYTES = 9 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 30_000_000;
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Validates an owner upload and stores it under a random name.
 * Images are re-encoded to WebP (max 2200px, EXIF rotation applied, metadata stripped);
 * MP4 clips are stored as-is after a container check. Returns the public path.
 */
export async function storeUpload(uploadDir: string, originalName: string, data: Buffer): Promise<string> {
  const ext = path.extname(originalName.toLowerCase());
  const isVideo = ext === '.mp4';
  if (!isVideo && !IMAGE_EXTENSIONS.has(ext)) throw new HttpError(422, 'Upload JPG, PNG, WebP or MP4 only.');
  if (data.length > (isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES)) {
    throw new HttpError(413, 'File is too large (images 9MB, videos 40MB).');
  }

  const id = crypto.randomBytes(12).toString('hex');
  if (isVideo) {
    if (data.length < 20 || !data.subarray(0, 24).includes('ftyp')) throw new HttpError(422, 'Invalid MP4 format.');
    const name = `${id}.mp4`;
    await fs.writeFile(path.join(uploadDir, name), data);
    return `uploads/${name}`;
  }

  let output: Buffer;
  try {
    output = await sharp(data, { limitInputPixels: MAX_IMAGE_PIXELS })
      .rotate()
      .resize(2200, 2200, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84, effort: 5 })
      .toBuffer();
  } catch (err) {
    const message = err instanceof Error && /pixel limit/i.test(err.message) ? 'Image dimensions too large.' : 'Could not read this image.';
    throw new HttpError(422, message);
  }
  const name = `${id}.webp`;
  await fs.writeFile(path.join(uploadDir, name), output);
  return `uploads/${name}`;
}
