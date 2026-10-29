import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RefreshSessionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  token: string;
}
