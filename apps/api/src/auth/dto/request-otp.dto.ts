import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
  @ApiProperty({ description: 'Phone number in E.164 format or 10-digit format' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'Please provide a valid phone number' })
  phone: string;
}
