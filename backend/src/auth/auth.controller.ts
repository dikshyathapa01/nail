import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Create a new user account in PostgreSQL' })
  @ApiResponse({ status: 201, description: 'User account created.' })
  @ApiResponse({ status: 400, description: 'Validation failed or invalid email domain.' })
  @ApiResponse({ status: 409, description: 'Email already registered.' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Alias for /auth/signup' })
  register(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user with email and password' })
  @ApiResponse({ status: 200, description: 'Authentication successful.' })
  @ApiResponse({ status: 401, description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
