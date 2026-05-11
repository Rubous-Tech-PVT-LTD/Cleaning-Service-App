import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all services with optional category filter' })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all services.' })
  findAll(@Query('categoryId') categoryId?: string) {
    return this.servicesService.findAll(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single service detail' })
  @ApiResponse({ status: 200, description: 'Return the service.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }
}
