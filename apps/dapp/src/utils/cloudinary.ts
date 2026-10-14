export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format: string;
  resourceType: string;
  bytes: number;
  originalFilename?: string;
  width?: number;
  height?: number;
}

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dhgqlxsgn',
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'bspc_1',
  apiKey: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || '213731348378775',
};

/**
 * Upload an image or file directly to Cloudinary using an unsigned upload preset.
 * 
 * Cloud Name: dhgqlxsgn
 * Default Preset: bspc_1 (Unsigned, type: upload)
 */
export async function uploadToCloudinary(
  file: File | Blob,
  customFileName?: string
): Promise<CloudinaryUploadResult> {
  const cloudName = CLOUDINARY_CONFIG.cloudName;
  const uploadPreset = CLOUDINARY_CONFIG.uploadPreset;
  const apiKey = CLOUDINARY_CONFIG.apiKey;

  if (!cloudName || !uploadPreset) {
    throw new Error('Cloudinary configuration is missing cloud name or upload preset.');
  }

  // Max size limit: 15 MB
  if ('size' in file && file.size > 15 * 1024 * 1024) {
    throw new Error('File exceeds the 15MB size limit.');
  }

  const formData = new FormData();
  const fileName = customFileName || (file instanceof File ? file.name : 'attachment');
  formData.append('file', file, fileName);
  formData.append('upload_preset', uploadPreset);
  if (apiKey) {
    formData.append('api_key', apiKey);
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || `Cloudinary upload failed: HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    format: data.format,
    resourceType: data.resource_type,
    bytes: data.bytes,
    originalFilename: data.original_filename || fileName,
    width: data.width,
    height: data.height,
  };
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}
