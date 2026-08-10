import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class NameTranslationsDto {
  @ApiProperty({ description: 'English name of the subcategory' })
  @IsString()
  @IsNotEmpty()
  en!: string;

  @ApiProperty({ description: 'Hindi name of the subcategory' })
  @IsString()
  @IsNotEmpty()
  hi!: string;
}

export class CreateSubcategoryDto {
  @ApiProperty({ description: 'The ID of the parent category' })
  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({ description: 'Name translations for the subcategory', type: NameTranslationsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => NameTranslationsDto)
  nameTranslations!: NameTranslationsDto;

  @ApiProperty({ description: 'URL-friendly slug for the subcategory' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ description: 'Icon URL for the subcategory', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;
}
