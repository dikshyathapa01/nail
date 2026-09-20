import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingsService } from './bookings.service';

@Controller('bookings')
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

  @Post()
  @ApiOperation({ summary: 'Request a booking' })
  @ApiResponse({ status: 201, description: 'Booking request saved successfully.' })
  @ApiResponse({ status: 409, description: 'The selected date and time are already requested.' })
  @ApiResponse({ status: 400, description: 'The booking payload failed validation.' })
  create(@Body() booking: CreateBookingDto) {
    return this.bookingsService.create(booking);
  }

  @Get()
  @ApiOperation({ summary: 'List booking requests for studio administration' })
  list() {
    return this.bookingsService.list();
  }
}
