import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

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
  pull(@Query('lastPulledAt') lastPulledAt?: string, @Query('userId') userId?: string, @Query('role') role?: string) {
    const timestamp = lastPulledAt ? parseInt(lastPulledAt) : null;
    return this.syncService.pullChanges(timestamp, userId, role);
  }

  @Post('push')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Push local changes from client to server' })
  push(@Body() body: any, @Query('lastPulledAt') lastPulledAt: string) {
    return this.syncService.pushChanges(body.changes || body, parseInt(lastPulledAt));
  }
}
