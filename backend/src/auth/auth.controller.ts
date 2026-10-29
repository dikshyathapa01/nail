import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.credential);
  }

  @Post('admin/create')
  @ApiOperation({ summary: 'Create an administrator using the private setup key' })
  createAdmin(@Body() dto: CreateAdminDto, @Headers('x-admin-setup-key') setupKey?: string) {
    return this.authService.createAdmin(dto, setupKey);
  }

  @Post('admin/login')
  @ApiOperation({ summary: 'Authenticate an administrator' })
  loginAdmin(@Body() dto: LoginDto) {
    return this.authService.loginAdmin(dto);
  }

  @Get('users')
  @ApiOperation({ summary: 'List registered users in database' })
  listUsers() {
    return this.authService.listUsers();
  }

  @Get('user/:id')
  @ApiOperation({ summary: 'Get user details by ID' })
  getUser(@Param('id') id: string) {
    return this.authService.findById(id);
  }
}
