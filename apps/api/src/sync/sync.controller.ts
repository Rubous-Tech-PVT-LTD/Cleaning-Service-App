import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // Pull is public — categories/services are read-only public data
  @Get('pull')
  @ApiOperation({ summary: 'Pull changes from server since last sync' })
  @ApiQuery({ name: 'lastPulledAt', required: false, type: Number })
  pull(@Query('lastPulledAt') lastPulledAt?: string) {
    const timestamp = lastPulledAt ? parseInt(lastPulledAt) : null;
    return this.syncService.pullChanges(timestamp);
  }

  @Post('push')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Push local changes from client to server' })
  push(@Body() body: any, @Query('lastPulledAt') lastPulledAt: string) {
    return this.syncService.pushChanges(body, parseInt(lastPulledAt));
  }
}
