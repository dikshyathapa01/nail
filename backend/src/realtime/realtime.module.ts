import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { UserSyncGateway } from './user-sync.gateway';

@Module({
  imports: [AuthModule],
  providers: [UserSyncGateway],
  exports: [UserSyncGateway],
})
export class RealtimeModule {}
