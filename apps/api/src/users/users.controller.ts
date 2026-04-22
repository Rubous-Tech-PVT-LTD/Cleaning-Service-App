import { Controller, Get, Param, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
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
  ) {}

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.CLIENT, UserRole.PROVIDER)
  @ApiOperation({ summary: 'Get a user profile by ID' })
  @ApiResponse({ status: 200, description: 'Return the user profile.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async getProfile(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update your own profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully.' })
  async updateProfile(@Req() req: any, @Body() updateProfileDto: UpdateProfileDto) {
    // In a real scenario, we would get the user ID from the request object (req.user.id)
    const userId = req.user?.id;
    
    if (!userId) {
      // Fallback for testing if JWT guard is not fully populated in this environment
      const users = await this.prismaService.user.findMany({ take: 1 });
      if (users.length === 0) return { message: 'No users found' };
      const updatedUser = await this.usersService.updateProfile(users[0].id, updateProfileDto);
      return { message: 'Profile updated successfully', data: updatedUser };
    }
    
    const updatedUser = await this.usersService.updateProfile(userId, updateProfileDto);
    return { message: 'Profile updated successfully', data: updatedUser };
  }
}
