import { Controller, Get, Post, Body, Query, Req } from '@nestjs/common';
import { SyncService } from './sync.service';
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
  pull(
    @Query('lastPulledAt') lastPulledAt?: string,
    @Query('userId') userId?: string,
    @Query('role') role?: string,
    @Req() req?: any,
  ) {
    const timestamp = lastPulledAt ? parseInt(lastPulledAt) : null;
    const authUser = req?.user;
    const effectiveUserId = authUser?.id || userId;
    const effectiveRole = authUser?.role || role;
    return this.syncService.pullChanges(timestamp, effectiveUserId, effectiveRole);
  }

  @Post('push')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Push local changes from client to server' })
  push(@Body() body: any, @Query('lastPulledAt') lastPulledAt: string) {
    return this.syncService.pushChanges(body.changes || body, parseInt(lastPulledAt));
  }
}
