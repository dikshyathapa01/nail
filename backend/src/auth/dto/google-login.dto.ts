import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
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

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  select_by?: string;

  @IsOptional()
  @IsString()
  g_csrf_token?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  deviceId?: string;
}
