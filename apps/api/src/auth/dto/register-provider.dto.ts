import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';

export class RegisterProviderDto {
  @ApiProperty({ description: 'Full name of the provider' })
  @IsNotEmpty()
  @IsString()
  fullName!: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Phone number (e.g. +919999999999)' })
  @IsNotEmpty()
  @IsString()
  phone!: string;

  @ApiProperty({ description: 'City' })
  @IsNotEmpty()
  @IsString()
  city!: string;

  @ApiProperty({ description: 'State' })
  @IsNotEmpty()
  @IsString()
  state!: string;

  @ApiProperty({ description: 'Country' })
  @IsNotEmpty()
  @IsString()
  country!: string;

  @ApiProperty({ description: 'Address Line 1' })
  @IsNotEmpty()
  @IsString()
  addressLine1!: string;

  @ApiProperty({ description: 'Latitude for location-based matching' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({ description: 'Longitude for location-based matching' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ description: 'Profession/Service ID' })
  @IsNotEmpty()
  @IsString()
  professionId!: string;

  @ApiPropertyOptional({ description: 'Uploaded documents JSON' })
  @IsOptional()
  documents?: any;
}
