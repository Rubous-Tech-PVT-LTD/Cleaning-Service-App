import { Controller, Get, Param, Delete, HttpCode, HttpStatus, Post, Body, Patch } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@ApiTags('Subcategories')
@Controller('subcategories')
export class SubcategoriesController {
  constructor(private readonly subcategoriesService: SubcategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subcategories' })
  @ApiResponse({ status: 200, description: 'Return all subcategories.' })
  findAll() {
    return this.subcategoriesService.findAll();
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get subcategories by category' })
  @ApiResponse({ status: 200, description: 'Return subcategories for category.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.subcategoriesService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single subcategory' })
  @ApiResponse({ status: 200, description: 'Return the subcategory.' })
  @ApiResponse({ status: 404, description: 'Subcategory not found.' })
  findOne(@Param('id') id: string) {
    return this.subcategoriesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subcategory' })
  @ApiResponse({ status: 201, description: 'Subcategory created successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  @ApiResponse({ status: 409, description: 'Subcategory with this slug already exists in category.' })
  create(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.subcategoriesService.create(createSubcategoryDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subcategory' })
  @ApiResponse({ status: 200, description: 'Subcategory updated successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Subcategory or category not found.' })
  @ApiResponse({ status: 409, description: 'Subcategory with this slug already exists in category.' })
  update(@Param('id') id: string, @Body() updateSubcategoryDto: UpdateSubcategoryDto) {
    return this.subcategoriesService.update(id, updateSubcategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a subcategory' })
  @ApiResponse({ status: 204, description: 'Subcategory deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Subcategory not found.' })
  @ApiResponse({ status: 400, description: 'Cannot delete subcategory with services.' })
  async remove(@Param('id') id: string) {
    return this.subcategoriesService.remove(id);
  }
}
