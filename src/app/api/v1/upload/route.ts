import { NextRequest } from 'next/server';
import { requireAuth } from '@/server/auth/guards';
import { CloudinaryService } from '@/server/storage/cloudinary.service';
import { ApiResponse } from '@/server/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    await requireAuth();

    // Verify Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return ApiResponse.error(
        'Cloudinary credentials are not configured in .env file (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)',
        500,
        'STORAGE_CONFIG_ERROR'
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'shopnear_finance/invoices';

    if (!file) {
      return ApiResponse.error('No image file provided in upload request', 400, 'BAD_REQUEST');
    }

    // Validate mime type (JPEG, PNG, WebP, PDF)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return ApiResponse.error(
        'Invalid file type. Only JPG, PNG, WEBP, and PDF documents are supported.',
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return ApiResponse.error('File size exceeds the 10MB limit.', 400, 'FILE_TOO_LARGE');
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await CloudinaryService.uploadImage(buffer, folder);

    return ApiResponse.success(
      {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        bytes: result.bytes,
      },
      'File uploaded to Cloudinary successfully'
    );
  } catch (err: any) {
    console.error('[UploadAPI] Cloudinary upload failed:', err);
    return ApiResponse.handle(err);
  }
}
