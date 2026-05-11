import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: 'The new status for the booking' })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;
}
