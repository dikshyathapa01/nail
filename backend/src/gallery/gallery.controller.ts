import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { GalleryService, UploadedImage } from './gallery.service';

@Controller('gallery')
@ApiTags('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'List portfolio gallery items' })
  list() {
    return this.galleryService.list();
  }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a portfolio photo (administrators only)' })
  create(
    @Body('title') title: string,
    @Body('category') category: string,
    @UploadedFile() file?: UploadedImage,
  ) {
    return this.galleryService.create(title, category, file);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remove a portfolio photo (administrators only)' })
  remove(@Param('id') id: string) {
    return this.galleryService.remove(id);
  }
}
