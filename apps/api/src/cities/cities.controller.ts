import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CitiesService } from './cities.service';
import { CheckLocationDto } from './dto/check-location.dto';

@ApiTags('Cities')
@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all supported service cities' })
  @ApiResponse({ status: 200, description: 'Return active supported cities.' })
  findAll() {
    return this.citiesService.findAll();
  }

  @Post('check')
  @ApiOperation({ summary: 'Check if a location is inside a supported city' })
  @ApiResponse({ status: 200, description: 'Return serviceability result.' })
  checkLocation(@Body() dto: CheckLocationDto) {
    return this.citiesService.checkLocation(dto);
  }
}
