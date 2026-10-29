import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoginDto } from './dto/login.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { User } from './user.entity';
import { Admin } from './admin.entity';
import { hashPassword, comparePassword } from '../common/password.util';
import { verifyRealEmail } from '../common/email-verifier';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  createdAt?: string;
  isAdmin: boolean;
  isVerified: boolean;
  token?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  private async formatUser(user: User): Promise<UserResponse> {
    const name = user.name || [user.firstName, user.lastName].filter(Boolean).join(' ') || 'User';
    const initials = name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      id: user.id,
      name,
      email: user.email,
      phone: user.phone || '',
      avatar: initials || 'U',
      createdAt: user.createdAt?.toISOString(),
      isAdmin: Boolean(
        await this.adminRepository.findOne({
          where: { email: user.email.toLowerCase(), isActive: true },
        }),
      ),
      isVerified: user.isVerified,
    };
  }

  private formatAdmin(admin: Admin): UserResponse {
    const initials = admin.name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: '',
      avatar: initials || 'A',
      createdAt: admin.createdAt?.toISOString(),
      isAdmin: true,
      isVerified: true,
    };
  }

  private signAdminToken(email: string) {
    const payload = Buffer.from(
      JSON.stringify({ email: email.toLowerCase(), exp: Date.now() + 1000 * 60 * 60 * 12 }),
    ).toString('base64url');
    const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'local-development-secret')
      .update(payload)
      .digest('base64url');
    return `${payload}.${signature}`;
  }

  private signUserToken(user: User) {
    const payload = Buffer.from(JSON.stringify({
      sub: user.id,
      email: user.email,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    })).toString('base64url');
    const signature = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'local-development-secret')
      .update(payload).digest('base64url');
    return `${payload}.${signature}`;
  }

  async verifyUserToken(token: string): Promise<User | null> {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;
    const expected = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'local-development-secret')
      .update(payload).digest('base64url');
    if (signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { sub?: string; exp?: number };
      if (!decoded.sub || !decoded.exp || decoded.exp <= Date.now()) return null;
      const user = await this.userRepository.findOne({ where: { id: decoded.sub, isActive: true } });
      return user?.isVerified ? user : null;
    } catch {
      return null;
    }
  }

  async verifyAdminToken(token: string): Promise<boolean> {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;
    const expected = createHmac('sha256', process.env.AUTH_TOKEN_SECRET || 'local-development-secret')
      .update(payload)
      .digest('base64url');
    if (signature.length !== expected.length) return false;
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
    try {
      const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
        email?: string;
        exp?: number;
      };
      if (!decoded.email || !decoded.exp || decoded.exp <= Date.now()) return false;
      const admin = await this.adminRepository.findOne({
        where: { email: decoded.email.toLowerCase(), isActive: true },
      });
      return Boolean(admin);
    } catch {
      return false;
    }
  }

  async loginWithGoogle(credential: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      throw new UnauthorizedException('Google authentication is not configured on the backend.');
    }
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) throw new UnauthorizedException('Google authentication failed.');
    const profile = await response.json() as { sub?: string; email?: string; email_verified?: string; name?: string; picture?: string; aud?: string };
    if (!profile.sub || !profile.email || profile.email_verified !== 'true' ||
      profile.aud !== clientId) {
      throw new UnauthorizedException('Google account could not be verified.');
    }
    const email = profile.email.toLowerCase();
    try {
      const googleUser = await this.userRepository.findOne({ where: { googleId: profile.sub } });
      const emailUser = await this.userRepository.findOne({ where: { email } });
      if (googleUser && emailUser && googleUser.id !== emailUser.id) {
        throw new ConflictException('This Google account and email belong to different user records.');
      }
      let user = googleUser || emailUser;
      if (!user) {
        user = this.userRepository.create({
          email,
          name: profile.name || 'Google user',
          password: hashPassword(randomBytes(32).toString('hex')),
          googleId: profile.sub,
          isVerified: true,
          isActive: true,
        });
      } else {
        user.googleId = profile.sub;
        user.isVerified = true;
        if (profile.name && !user.name) user.name = profile.name;
      }
      user.isVerified = true;
      const saved = await this.userRepository.save(user);
      const responseUser = await this.formatUser(saved);
      return { message: 'Welcome back!', user: responseUser, token: this.signUserToken(saved) };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Google user synchronization failed: ${message}`);
      if (/column .* does not exist|relation .* does not exist/i.test(message)) {
        throw new InternalServerErrorException(
          'The database is missing the Google authentication columns. Apply database/migrations/001-auth-bookings.sql and redeploy.',
        );
      }
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException('This Google email or account is already linked to another user.');
      }
      throw new InternalServerErrorException('Unable to save your Google profile. Please try again.');
    }
  }

  async createAdmin(dto: CreateAdminDto, setupKey: string | undefined) {
    const expectedKey = process.env.ADMIN_SETUP_KEY;
    if (!expectedKey || !setupKey || setupKey !== expectedKey) {
      throw new UnauthorizedException('A valid administrator setup key is required.');
    }

    const email = dto.email.trim().toLowerCase();
    await verifyRealEmail(email);
    if (await this.adminRepository.findOne({ where: { email } })) {
      throw new ConflictException('An administrator with this email already exists.');
    }

    const admin = await this.adminRepository.save(
      this.adminRepository.create({
        name: dto.name.trim(),
        email,
        password: hashPassword(dto.password),
        isActive: true,
      }),
    );
    this.logger.log(`Administrator created: ${admin.email} (${admin.id})`);
    return {
      message: 'Administrator created successfully. Use /auth/admin/login to sign in.',
      admin: this.formatAdmin(admin),
    };
  }

  async loginAdmin(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const admin = await this.adminRepository.findOne({ where: { email } });
    if (!admin || !admin.isActive || !comparePassword(dto.password, admin.password)) {
      throw new UnauthorizedException('Invalid administrator email or password.');
    }
    return {
      message: 'Administrator login successful.',
      user: this.formatAdmin(admin),
      adminToken: this.signAdminToken(admin.email),
    };
  }

  async findById(id: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? await this.formatUser(user) : null;
  }

  async listUsers(): Promise<UserResponse[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return Promise.all(users.map((user) => this.formatUser(user)));
  }
}
