import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user?: {
    id: string;
    role: string;
  };
}

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review for a completed booking' })
  create(
    @Request() req: RequestWithUser,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    const userId = req.user?.id || '';
    return this.reviewsService.create(userId, createReviewDto);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get all reviews for a specific service' })
  findByService(@Param('serviceId') serviceId: string) {
    return this.reviewsService.findByService(serviceId);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all reviews for the logged-in provider' })
  findProviderReviews(@Request() req: RequestWithUser) {
    const userId = req.user?.id || '';
    return this.reviewsService.findByProvider(userId);
  }
}
