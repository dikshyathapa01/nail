import { Body, Controller, Delete, Get, Patch, Post, Query, UseGuards, Param, Req } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';
import { AdminGuard } from '../auth/admin.guard';
import { UserGuard, AuthenticatedRequest } from '../auth/user.guard';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AvailabilityBlockDto } from './dto/availability-block.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller(['bookings', 'appointments'])
@ApiTags('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('availability')
  @ApiOperation({ summary: 'Check appointment availability for a date' })
  @ApiQuery({ name: 'date', required: true, example: '2026-09-07', description: 'Date in YYYY-MM-DD format' })
  @ApiResponse({ status: 200, description: 'Available and unavailable time slots for the date.' })
  getAvailability(@Query('date') date: string) {
    return this.bookingsService.getAvailability(date);
  }

  @Get('admin/availability-blocks')
  @UseGuards(AdminGuard)
  listAvailabilityBlocks() {
    return this.bookingsService.listAvailabilityBlocks();
  }

  @Post('admin/availability-blocks')
  @UseGuards(AdminGuard)
  createAvailabilityBlock(@Body() block: AvailabilityBlockDto) {
    return this.bookingsService.createAvailabilityBlock(block);
  }

  @Delete('admin/availability-blocks/:id')
  @UseGuards(AdminGuard)
  deleteAvailabilityBlock(@Param('id') id: string) {
    return this.bookingsService.deleteAvailabilityBlock(id);
  }

  @Post()
  @ApiOperation({ summary: 'Request a booking' })
  @ApiResponse({ status: 201, description: 'Booking request saved successfully.' })
  @ApiResponse({ status: 409, description: 'The selected date and time are already requested.' })
  @ApiResponse({ status: 400, description: 'The booking payload failed validation.' })
  @UseGuards(UserGuard)
  create(@Body() booking: CreateBookingDto, @Req() request: AuthenticatedRequest) {
    return this.bookingsService.create({ ...booking, userId: request.user.id });
  }

  @Patch(':id')
  @UseGuards(UserGuard)
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto, @Req() request: AuthenticatedRequest) {
    return this.bookingsService.updateForUser(id, request.user.id, dto);
  }

  @Delete(':id')
  @UseGuards(UserGuard)
  cancel(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.bookingsService.cancelForUser(id, request.user.id);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List booking requests for studio administration or filtered by user' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter bookings by User UUID' })
  @ApiQuery({ name: 'email', required: false, description: 'Filter bookings by customer email' })
  list(@Query('userId') userId?: string, @Query('email') email?: string) {
    return this.bookingsService.list(userId, email);
  }

  @Get('mine')
  @UseGuards(UserGuard)
  listMine(@Req() request: AuthenticatedRequest) {
    return this.bookingsService.list(request.user.id);
  }

  @Get('admin')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List all booking requests (administrators only)' })
  listForAdmin() {
    return this.bookingsService.list();
  }

  @Patch('admin/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update an appointment status (administrators only)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto.status);
  }
}
