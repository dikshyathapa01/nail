import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudioService } from './service.entity';
import { UploadedImage } from '../gallery/gallery.service';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);
  constructor(@InjectRepository(StudioService) private readonly repository: Repository<StudioService>) {}

  private response(service: StudioService) {
    return {
      id: service.id,
      name: service.name,
      category: service.category,
      duration: service.duration,
      description: service.description,
      price: Number(service.price),
      image: service.imageUrl || (service.imageData && service.mimeType ? `data:${service.mimeType};base64,${service.imageData}` : ''),
    };
  }

  async list() {
    try {
      return (await this.repository.find({ order: { createdAt: 'DESC' } })).map((service) => this.response(service));
    } catch (error) {
      this.logger.error(`Unable to load services: ${error instanceof Error ? error.message : String(error)}`);
      throw new ServiceUnavailableException(
        'Services are temporarily unavailable. Restart the API with database synchronization enabled or apply the studio_services schema.',
      );
    }
  }

  async create(fields: { name: string; category: string; duration: string; description: string; price: string; imageUrl?: string }, file?: UploadedImage, id?: string) {
    const name = fields.name?.trim();
    const category = fields.category?.trim();
    const duration = fields.duration?.trim();
    const description = fields.description?.trim();
    const price = Number(fields.price);
    if (!name || !category || !duration || !description || !Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Name, category, duration, description, and a valid price are required.');
    }
    if (file && (!allowedTypes.has(file.mimetype) || file.size > 5 * 1024 * 1024)) {
      throw new BadRequestException('Service photos must be JPG, PNG, WEBP, or GIF images of 5 MB or less.');
    }
    try {
      const existing = id ? await this.repository.findOne({ where: { id } }) : null;
      if (id && !existing) throw new NotFoundException('Service not found.');
      const service = await this.repository.save(this.repository.create({
        ...(existing || {}),
        name, category, duration, description, price,
        imageData: file ? file.buffer.toString('base64') : existing?.imageData || null,
        mimeType: file ? file.mimetype : existing?.mimeType || null,
        imageUrl: fields.imageUrl?.trim() || existing?.imageUrl || null,
      }));
      return this.response(service);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('That service already exists.');
      throw error;
    }
  }

  async remove(id: string) {
    const service = await this.repository.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found.');
    await this.repository.remove(service);
    return { message: 'Service removed.' };
  }
}
