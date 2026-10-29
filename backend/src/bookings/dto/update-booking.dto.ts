import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BOOKING_SERVICES, BOOKING_TIMES } from './create-booking.dto';

export class UpdateBookingDto {
  @ApiProperty({ required: false, enum: BOOKING_SERVICES })
  @IsOptional()
  @IsIn(BOOKING_SERVICES)
  service?: (typeof BOOKING_SERVICES)[number];

  @ApiProperty({ required: false, format: 'date' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @ApiProperty({ required: false, enum: BOOKING_TIMES })
  @IsOptional()
  @IsIn(BOOKING_TIMES)
  time?: (typeof BOOKING_TIMES)[number];

  @ApiProperty({ required: false, maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}
