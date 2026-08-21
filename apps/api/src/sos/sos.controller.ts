import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { SosService } from './sos.service';
import { CreateSosDto } from './dto/create-sos.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('SOS')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sos')
export class SosController {
  constructor(private readonly sosService: SosService) {}

  @Post()
  @ApiOperation({ summary: 'Trigger an SOS emergency alert for an active booking' })
  @ApiBody({ type: CreateSosDto })
  @ApiResponse({ status: 201, description: 'SOS alert created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid booking status or coordinates' })
  @ApiResponse({ status: 403, description: 'User is not part of the booking' })
  @ApiResponse({ status: 404, description: 'User or Booking not found' })
  triggerSos(@Request() req: any, @Body() createSosDto: CreateSosDto) {
    return this.sosService.triggerSos(req.user.id, createSosDto);
  }
}
