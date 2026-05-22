import { Module } from '@nestjs/common';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TrackingModule } from '../tracking/tracking.module';

@Module({
  imports: [PrismaModule, AuthModule, TrackingModule],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
