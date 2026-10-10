import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryItem } from './gallery.entity';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export interface UploadedImage {
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryItem)
    private readonly galleryRepository: Repository<GalleryItem>,
  ) {}

  private configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new ServiceUnavailableException(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      );
    }
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  private uploadToCloudinary(file: UploadedImage) {
    return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: process.env.CLOUDINARY_FOLDER || 'nail-inspo/gallery',
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error('Cloudinary did not return an upload result.'));
            return;
          }
          resolve({ secure_url: result.secure_url, public_id: result.public_id });
        },
      );
      stream.end(file.buffer);
    });
  }

  private toResponse(item: GalleryItem) {
    return {
      id: item.id,
      title: item.title,
      category: item.category,
      image: item.imageUrl || (
        item.imageData && item.mimeType
          ? `data:${item.mimeType};base64,${item.imageData}`
          : ''
      ),
      createdAt: item.createdAt?.toISOString(),
    };
  }

  async list() {
    const items = await this.galleryRepository.find({
      order: { createdAt: 'DESC' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async create(title: string, category: string, file?: UploadedImage) {
    const cleanTitle = title?.trim();
    const cleanCategory = category?.trim();

    if (!cleanTitle || !cleanCategory) {
      throw new BadRequestException('Title and category are required.');
    }
    if (!file || !ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException('Upload a JPG, PNG, WEBP, or GIF image.');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new BadRequestException('Images must be 5 MB or smaller.');
    }

    this.configureCloudinary();
    let upload: { secure_url: string; public_id: string };
    try {
      upload = await this.uploadToCloudinary(file);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Cloudinary upload failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    try {
      const item = await this.galleryRepository.save(
        this.galleryRepository.create({
          title: cleanTitle,
          category: cleanCategory,
          imageUrl: upload.secure_url,
          cloudinaryPublicId: upload.public_id,
        }),
      );
      return this.toResponse(item);
    } catch (error) {
      await cloudinary.uploader.destroy(upload.public_id, { resource_type: 'image' });
      throw error;
    }
  }

  async remove(id: string) {
    const item = await this.galleryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Gallery item not found.');
    }
    if (item.cloudinaryPublicId) {
      this.configureCloudinary();
      try {
        await cloudinary.uploader.destroy(item.cloudinaryPublicId, { resource_type: 'image' });
      } catch (error) {
        throw new ServiceUnavailableException(
          `Cloudinary deletion failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    await this.galleryRepository.remove(item);
    return { message: 'Gallery item removed.' };
  }
}
