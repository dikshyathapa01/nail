import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceCategory } from './category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private readonly categoryRepository: Repository<ServiceCategory>,
  ) {}

  async list() {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  async create(name: string) {
    const cleanName = name?.trim();
    if (!cleanName) throw new BadRequestException('Category name is required.');
    try {
      return await this.categoryRepository.save(
        this.categoryRepository.create({ name: cleanName }),
      );
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('That category already exists.');
      }
      throw error;
    }
  }

  async remove(id: string) {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found.');
    await this.categoryRepository.remove(category);
    return { message: 'Category removed.' };
  }
}
