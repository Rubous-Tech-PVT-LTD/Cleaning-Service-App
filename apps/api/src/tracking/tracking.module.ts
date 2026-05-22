import { Module } from '@nestjs/common';
import { TrackingGateway } from './tracking.gateway';

@Module({
  providers: [TrackingGateway],
  exports: [TrackingGateway], // Export so other modules (like bookings) can use it
})
export class TrackingModule {}
