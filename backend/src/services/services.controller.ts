import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { ServicesService } from './services.service';
import { UploadedImage } from '../gallery/gallery.service';

@Controller('services')
@ApiTags('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list() { return this.servicesService.list(); }

  @Post()
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a studio service (administrators only)' })
  create(
    @Body() fields: { name: string; category: string; duration: string; description: string; price: string },
    @UploadedFile() file?: UploadedImage,
  ) { return this.servicesService.create(fields, file); }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() fields: { name: string; category: string; duration: string; description: string; price: string; imageUrl?: string },
    @UploadedFile() file?: UploadedImage,
  ) { return this.servicesService.create(fields, file, id); }

  @Put(':id')
  @UseGuards(AdminGuard)
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  updateWithPut(
    @Param('id') id: string,
    @Body() fields: { name: string; category: string; duration: string; description: string; price: string; imageUrl?: string },
    @UploadedFile() file?: UploadedImage,
  ) { return this.servicesService.create(fields, file, id); }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) { return this.servicesService.remove(id); }
}
