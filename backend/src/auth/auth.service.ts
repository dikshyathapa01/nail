import {
  ConflictException,
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { User } from './user.entity';
import { hashPassword, comparePassword } from '../common/password.util';
import { verifyRealEmail } from '../common/email-verifier';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  createdAt?: string;
}

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const demoEmail = 'sophiya@example.com';
    const existingUser = await this.userRepository.findOne({
      where: { email: demoEmail },
    });

    if (!existingUser) {
      await this.userRepository.save(
        this.userRepository.create({
          name: 'Sophiya Sharma',
          firstName: 'Sophiya',
          lastName: 'Sharma',
          email: demoEmail,
          phone: '+977 9841234567',
          password: hashPassword('password123'),
          isActive: true,
        }),
      );
      this.logger.log('Seeded the demo user through the User repository.');
    }
  }

  private formatUser(user: User): UserResponse {
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
    };
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
      const responseUser = this.formatUser(savedUser);
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

  async login(dto: LoginDto): Promise<{ message: string; user: UserResponse }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'No account found with this email. Please check your email or sign up.',
      );
    }

    if (!comparePassword(dto.password, user.password)) {
      throw new UnauthorizedException('Incorrect password. Please try again.');
    }

    const responseUser = this.formatUser(user);
    this.logger.log(`User logged in: ${responseUser.email}`);
    return { message: 'Welcome back!', user: responseUser };
  }

  async findById(id: string): Promise<UserResponse | null> {
    const user = await this.userRepository.findOne({ where: { id } });
    return user ? this.formatUser(user) : null;
  }

  async listUsers(): Promise<UserResponse[]> {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return users.map((user) => this.formatUser(user));
  }
}
