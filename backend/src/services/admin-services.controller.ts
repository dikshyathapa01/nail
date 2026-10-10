import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { UploadedImage } from '../gallery/gallery.service';
import { ServicesService } from './services.service';

@Controller('admin/services')
@ApiTags('admin-services')
@UseGuards(AdminGuard)
export class AdminServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List services for administrators' })
  list() {
    return this.servicesService.list();
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  create(
    @Body() fields: { name: string; category: string; duration: string; description: string; price: string; imageUrl?: string },
    @UploadedFile() file?: UploadedImage,
  ) {
    return this.servicesService.create(fields, file);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiConsumes('multipart/form-data')
  update(
    @Param('id') id: string,
    @Body() fields: { name: string; category: string; duration: string; description: string; price: string; imageUrl?: string },
    @UploadedFile() file?: UploadedImage,
  ) {
    return this.servicesService.create(fields, file, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
