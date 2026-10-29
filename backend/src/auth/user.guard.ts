import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { User } from './user.entity';

export interface AuthenticatedRequest extends Request { user: User }

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : '';
    const user = token ? await this.authService.verifyUserToken(token) : null;
    if (!user) throw new UnauthorizedException('A verified sign-in is required.');
    request.user = user;
    return true;
  }
}
