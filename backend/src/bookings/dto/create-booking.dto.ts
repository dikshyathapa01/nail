import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const BOOKING_SERVICES = [
  'Gel Nail Extensions',
  'BIAB (Builder in a Bottle)',
  'Sculpted Acrylic Extensions',
  'Bespoke 3D Nail Art & Charms',
  'Chrome & Metallic Artistry',
  'Signature Milky Gel Manicure',
  'Hand-Painted Accent Art',
  'Editorial Marble & Swirls',
  'Press-On Sizing & Custom Consultation',
  'Custom Reusable Press-On Sets',
] as const;

export const BOOKING_TIMES = [
  '09:00 - 10:30',
  '11:00 - 12:30',
  '13:30 - 15:00',
  '15:30 - 17:00',
] as const;

export class CreateBookingDto {

  @ApiProperty({ required: false, format: 'date', example: '2026-09-21' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  booking_date?: string;

  @ApiProperty({ enum: BOOKING_SERVICES, example: 'Signature Milky Gel Manicure' })
  @IsIn(BOOKING_SERVICES)
  service: (typeof BOOKING_SERVICES)[number];

  @ApiProperty({ format: 'date', example: '2026-09-21' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ enum: BOOKING_TIMES, example: '09:00 - 10:30' })
  @IsIn(BOOKING_TIMES)
  time: (typeof BOOKING_TIMES)[number];

  @ApiProperty({ example: 'Dikshya Shrestha', minLength: 2, maxLength: 100 })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false, example: '+977 9863027467' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiProperty({ required: false, example: 'hello@example.com' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiProperty({ required: false, maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;

  @ApiProperty({ required: false, example: 'd3b07384-d113-4638-9562-b91c89069d2a' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ required: false, maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  details?: string;
}
