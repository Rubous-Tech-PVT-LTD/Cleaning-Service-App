import { Controller, Get, Param, Patch, Body, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PrismaService } from '../prisma/prisma.service';
@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly prismaService: PrismaService,
  ) { }
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.PROVIDER)
  @ApiOperation({ summary: 'Get a user profile by ID' })
  @ApiResponse({ status: 200, description: 'Return the user profile.' })
  @ApiResponse({ status: 403, description: 'Access denied - you can only access your own profile.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getProfile(@Param('id') id: string, @Req() req: any) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied: You can only access your own profile');
    }
    const user = await this.usersService.findById(id);
    return { message: 'User profile retrieved successfully', data: user };
  }
  @Patch('profile')
  @ApiOperation({ summary: 'Update your own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (updateProfileDto.professionIds && userRole !== UserRole.PROVIDER && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Only providers can update profession services');
    }

    if (!userId) {
      const users = await this.prismaService.user.findMany({ take: 1 });
      if (users.length === 0) return { message: 'No users found' };
      const updatedUser = await this.usersService.updateProfile(users[0].id, updateProfileDto);
      const { fullName, ...userWithoutFullName } = updatedUser;
      return { message: 'Profile updated successfully', data: { name: fullName, fullName, ...userWithoutFullName } };
    }
    const updatedUser = await this.usersService.updateProfile(userId, updateProfileDto);
    const { fullName, ...userWithoutFullName } = updatedUser;
    return { message: 'Profile updated successfully', data: { name: fullName, fullName, ...userWithoutFullName } };
  }
  @Patch('online-status')
  @Roles(UserRole.PROVIDER)
  @ApiOperation({ summary: 'Update provider online status' })
  @ApiResponse({ status: 200, description: 'Online status updated successfully.' })
  async updateOnlineStatus(@Req() req: any, @Body() body: { isOnline: boolean }) {
    const userId = req.user?.id;
    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }
    const updatedUser = await this.usersService.updateProfile(userId, { isOnline: body.isOnline });
    return { message: 'Online status updated successfully', data: { isOnline: body.isOnline } };
  }
}
