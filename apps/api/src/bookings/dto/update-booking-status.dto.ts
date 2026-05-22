import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, description: 'The new status for the booking' })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;

  @ApiPropertyOptional({ description: 'The 4-digit OTP provided by the client to complete the job' })
  @IsOptional()
  @IsString()
  @Length(4, 4)
  otp?: string;
}
