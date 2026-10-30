import { Body, Controller, Get, Headers, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { AdminGuard } from './admin.guard';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('google')
  loginWithGoogle(@Body() dto: GoogleLoginDto) {
    return this.authService.loginWithGoogle(dto.credential, dto.deviceId);
  }

  @Post('google/callback')
  googleRedirectCallback(@Body() dto: GoogleLoginDto, @Res() response: Response) {
    const configuredFrontendUrl = process.env.FRONTEND_URL?.trim();
    const frontendUrl = configuredFrontendUrl &&
      !(process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(configuredFrontendUrl))
      ? configuredFrontendUrl
      : 'https://nail-gilt.vercel.app';
    const credential = encodeURIComponent(dto.credential);
    return response.redirect(
      `${frontendUrl}/auth/callback#credential=${credential}`,
    );
  }

  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    return this.authService.revokeUserSession(token);
  }

  @Post('refresh')
  refresh(@Body() dto: RefreshSessionDto) {
    return this.authService.refreshUserSession(dto.token);
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
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'List registered users in database' })
  listUsers() {
    return this.authService.listUsers();
  }

  @Get('user/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get user details by ID' })
  getUser(@Param('id') id: string) {
    return this.authService.findById(id);
  }
}
