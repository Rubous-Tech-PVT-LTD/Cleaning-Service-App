import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ description: '6-digit OTP code received via SMS' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
