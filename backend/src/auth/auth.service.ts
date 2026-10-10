import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignupDto } from './dto/signup.dto';
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

  async signup(dto: SignupDto): Promise<{ message: string; user: UserResponse }> {
    const email = dto.email.trim().toLowerCase();
    await verifyRealEmail(email);

    if (await this.userRepository.findOne({ where: { email } })) {
      throw new ConflictException(
        'An account with this email already exists. Please sign in instead.',
      );
    }

    const name = dto.name?.trim() || [dto.firstName, dto.lastName].filter(Boolean).join(' ');
    const user = this.userRepository.create({
      name,
      firstName: dto.firstName?.trim() || name.split(' ')[0],
      lastName: dto.lastName?.trim() || name.split(' ').slice(1).join(' ') || null,
      email,
      phone: dto.phone?.trim() || null,
      password: hashPassword(dto.password),
      isActive: true,
    });

    try {
      const savedUser = await this.userRepository.save(user);
      const responseUser = await this.formatUser(savedUser);
      this.logger.log(`New user registered: ${responseUser.email} (${responseUser.id})`);
      return {
        message: 'Account created successfully! Please sign in with your credentials.',
        user: responseUser,
      };
    } catch (error) {
      if ((error as { code?: string }).code === '23505') {
        throw new ConflictException(
          'An account with this email already exists. Please sign in instead.',
        );
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<{ message: string; user: UserResponse; adminToken?: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.isActive) {
      const admin = await this.adminRepository.findOne({
        where: { email, isActive: true },
      });
      if (admin && comparePassword(dto.password, admin.password)) {
        return {
          message: 'Administrator login successful.',
          user: this.formatAdmin(admin),
          adminToken: this.signAdminToken(admin.email),
        };
      }
      throw new UnauthorizedException(
        'No account found with this email. Please check your email or sign up.',
      );
    }

    if (!comparePassword(dto.password, user.password)) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    const responseUser = await this.formatUser(user);
    this.logger.log(`User logged in: ${responseUser.email}`);
    return {
      message: 'Welcome back!',
      user: responseUser,
      ...(responseUser.isAdmin ? { adminToken: this.signAdminToken(responseUser.email) } : {}),
    };
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
