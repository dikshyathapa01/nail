import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UserSession } from './user-session.entity';
import { AdminGuard } from './admin.guard';
import { Admin } from './admin.entity';
import { UserGuard } from './user.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Admin, UserSession])],
  controllers: [AuthController],
  providers: [AuthService, AdminGuard, UserGuard],
  exports: [AuthService, UserGuard],
})
export class AuthModule {}
