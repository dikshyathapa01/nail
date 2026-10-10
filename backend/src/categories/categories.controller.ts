import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../auth/admin.guard';
import { CategoriesService } from './categories.service';

@Controller('categories')
@ApiTags('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List service categories' })
  list() {
    return this.categoriesService.list();
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a service category (administrators only)' })
  create(@Body('name') name: string) {
    return this.categoriesService.create(name);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a service category (administrators only)' })
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }
}
