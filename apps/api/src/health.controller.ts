import { Controller, Get, Version } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('System')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Standard health check' })
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || 'v1',
    };
  }
}
