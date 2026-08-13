import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { SyncService, SyncChanges } from './sync.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

interface SyncPushDto {
  changes?: any;
}

@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  // Pull handles categories/services (public) and user-data (private)
  @Get('pull')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pull changes from server since last sync' })
  @ApiQuery({ name: 'lastPulledAt', required: false, type: Number })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'role', required: false, type: String })
  pull(
    @Query('lastPulledAt') lastPulledAt?: string,
    @Query('userId') userId?: string,
    @Query('role') role?: string,
  ) {
    const timestamp = lastPulledAt ? parseInt(lastPulledAt) : null;
    return this.syncService.pullChanges(timestamp, userId, role);
  }

  @Post('push')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Push local changes from client to server' })
  push(@Body() body: SyncPushDto) {
    const changes = (body.changes || body) as SyncChanges;
    return this.syncService.pushChanges(changes);
  }
}
