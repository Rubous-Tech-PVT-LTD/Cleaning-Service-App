import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TrackingGateway } from './tracking.gateway';
import { PrismaModule } from '../prisma/prisma.module';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
    PrismaModule,
  ],
  providers: [TrackingGateway],
  exports: [TrackingGateway],
})
export class TrackingModule { }
