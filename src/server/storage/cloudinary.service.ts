import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export interface UploadResult {
  url: string;
  publicId: string;
  format: string;
  bytes: number;
}

export class CloudinaryService {
  /**
   * Uploads an image buffer or base64 string to Cloudinary
   */
  static async uploadImage(
    fileBuffer: Buffer | string,
    folder = 'shopnear_finance/invoices'
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadOptions = {
        folder,
        resource_type: 'image' as const,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      };

      if (typeof fileBuffer === 'string') {
        cloudinary.uploader.upload(fileBuffer, uploadOptions, (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Upload to Cloudinary failed'));
          }
          resolve({
            url: result.secure_url || result.url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
          });
        });
      } else {
        const stream = cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Upload to Cloudinary failed'));
            }
            resolve({
              url: result.secure_url || result.url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes,
            });
          }
        );
        stream.end(fileBuffer);
      }
    });
  }
}
