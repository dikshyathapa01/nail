import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Credential returned by Google Identity Services',
    minLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  credential: string;
}
