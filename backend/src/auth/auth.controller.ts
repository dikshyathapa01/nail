import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

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
