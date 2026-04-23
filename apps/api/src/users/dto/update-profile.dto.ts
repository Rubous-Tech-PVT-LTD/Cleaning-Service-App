import { IsOptional, IsString, IsObject, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ required: false, description: 'Full name of the user' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiProperty({ required: false, description: 'Preferred language code (e.g. "hi" or "en")' })
  @IsOptional()
  @IsString()
  languagePref?: string;

  @ApiProperty({ required: false, description: 'User biography in JSON format' })
  @IsOptional()
  @IsObject()
  bio?: Record<string, any>;

  @ApiProperty({ required: false, description: 'URL to the avatar image' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}
