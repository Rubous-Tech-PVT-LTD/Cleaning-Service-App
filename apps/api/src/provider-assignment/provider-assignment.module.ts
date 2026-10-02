import { Module } from '@nestjs/common';
import { ProviderAssignmentService } from './provider-assignment.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ProviderAssignmentService],
  exports: [ProviderAssignmentService],
})
export class ProviderAssignmentModule {}
