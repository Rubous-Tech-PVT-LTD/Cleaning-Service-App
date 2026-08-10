import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { NameTranslationsDto } from './create-subcategory.dto';

export class UpdateSubcategoryDto {
  @ApiProperty({ description: 'Updated category ID', required: false })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ description: 'Updated name translations for the subcategory', type: NameTranslationsDto, required: false })
  @IsObject()
  @ValidateNested()
  @Type(() => NameTranslationsDto)
  @IsOptional()
  nameTranslations?: NameTranslationsDto;

  @ApiProperty({ description: 'Updated URL-friendly slug for the subcategory', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Updated icon URL for the subcategory', required: false })
  @IsString()
  @IsOptional()
  iconUrl?: string;
}
