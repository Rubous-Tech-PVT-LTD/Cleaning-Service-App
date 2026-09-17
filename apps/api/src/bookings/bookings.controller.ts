import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) { }
  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Roles(UserRole.CLIENT)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  create(@Request() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all bookings for the current user' })
  findAll(@Request() req: any) {
    return this.bookingsService.findAll(req.user.id, req.user.role);
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific booking' })
  @ApiResponse({ status: 200, description: 'Return the booking.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  @ApiResponse({ status: 403, description: 'Access denied.' })
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.bookingsService.findOne(id, req.user);
  }
  @Patch(':id/status')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Update the status of a booking' })
  updateStatus(@Request() req: any, @Param('id') id: string, @Body() updateStatusDto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, updateStatusDto, req.user);
  }
}
