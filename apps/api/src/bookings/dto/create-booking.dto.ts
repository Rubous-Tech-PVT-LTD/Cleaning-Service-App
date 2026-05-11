import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsDateString, IsNumber, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ description: 'The ID of the service to book' })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({ description: 'The scheduled date and time for the service' })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiProperty({ description: 'The total price agreed for the service' })
  @IsNumber()
  @IsNotEmpty()
  totalPrice: number;

  @ApiProperty({ description: 'Optional provider ID if pre-selected' })
  @IsString()
  @IsOptional()
  providerId?: string;

  @ApiProperty({ description: 'Optional offline ID for mobile sync' })
  @IsString()
  @IsOptional()
  offlineId?: string;
}
