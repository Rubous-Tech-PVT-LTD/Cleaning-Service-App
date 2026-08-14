import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CartBookingType {
  INSTANT = 'instant',
  SCHEDULED = 'scheduled',
}

export class CartScheduleDto {
  @ApiPropertyOptional()
  @IsOptional()
  dateId?: number;

  @ApiProperty({ example: '12 Aug' })
  @IsString()
  @IsNotEmpty()
  dateLabel: string;

  @ApiProperty({ example: 'Today' })
  @IsString()
  @IsNotEmpty()
  dayLabel: string;

  @ApiProperty({ example: '2026-08-12' })
  @IsString()
  @IsNotEmpty()
  dateISO: string;

  @ApiProperty({ example: '3:30 PM' })
  @IsString()
  @IsNotEmpty()
  time: string;
}

export class AddToCartDto {
  @ApiProperty({ description: 'Cart line item payload from the client' })
  @IsObject()
  @IsNotEmpty()
  item: Record<string, any>;

  @ApiProperty({
    enum: CartBookingType,
    description: 'Backend-owned booking mode for this cart item',
  })
  @IsEnum(CartBookingType)
  bookingType: CartBookingType;

  @ApiPropertyOptional({ type: CartScheduleDto })
  @ValidateIf((o: AddToCartDto) => o.bookingType === CartBookingType.SCHEDULED)
  @ValidateNested()
  @Type(() => CartScheduleDto)
  @IsNotEmpty({ message: 'schedule is required when bookingType is scheduled' })
  schedule?: CartScheduleDto;
}
