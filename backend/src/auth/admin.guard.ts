import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';

    if (!token) {
      throw new UnauthorizedException('Administrator access is required.');
    }
    const user = await this.authService.verifyUserToken(token);
    if (user) {
      if (user.role !== 'admin') {
        throw new ForbiddenException('Administrator access is required.');
      }
      return true;
    }
    if (!(await this.authService.verifyAdminToken(token))) {
      throw new UnauthorizedException('Administrator access is required.');
    }

    return true;
  }
}
