import { Controller, Get, Post, Body, Query, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { SyncService } from './sync.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
@ApiTags('Sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) { }
  @Get('pull')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Pull changes from server since last sync' })
  @ApiQuery({ name: 'lastPulledAt', required: false, type: Number })
  pull(
    @Query('lastPulledAt') lastPulledAt?: string,
    @Req() req?: any,
  ) {
    const timestamp = lastPulledAt ? parseInt(lastPulledAt) : null;
    const authUser = req?.user;
    
   
    if (!authUser?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    
    return this.syncService.pullChanges(timestamp, authUser.id, authUser.role);
  }
  @Post('push')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Push local changes from client to server' })
  push(@Body() body: any, @Query('lastPulledAt') lastPulledAt: string, @Req() req?: any) {
    const authUser = req?.user;
    
   
    if (!authUser?.id) {
      throw new UnauthorizedException('Authentication required');
    }
    
    return this.syncService.pushChanges(body.changes || body, parseInt(lastPulledAt), authUser.id, authUser.role);
  }
}
