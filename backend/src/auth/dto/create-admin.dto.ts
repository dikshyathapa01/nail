import { IsEmail, IsString, Length, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ example: 'Studio Admin' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'strong-password-123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
