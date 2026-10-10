import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { StudioService } from './service.entity';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';

@Module({
  imports: [TypeOrmModule.forFeature([StudioService]), AuthModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
