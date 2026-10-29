import { IsIn, IsOptional, Matches } from 'class-validator';
import { BOOKING_TIMES } from './create-booking.dto';

export class AvailabilityBlockDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @IsOptional()
  @IsIn([...BOOKING_TIMES, 'FULL_DAY'])
  time?: string;
}
