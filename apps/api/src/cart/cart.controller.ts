import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AddToCartDto } from './dto/add-to-cart.dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
    [key: string]: any;
  };
}

@ApiTags('Cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Return user cart.' })
  getCart(@Request() req: RequestWithUser) {
    return this.cartService.getCart(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 201, description: 'Item added to cart.' })
  addToCart(@Request() req: RequestWithUser, @Body() body: AddToCartDto) {
    return this.cartService.addToCart(req.user.id, body);
  }

  @Put()
  @ApiOperation({ summary: 'Update cart item' })
  @ApiResponse({ status: 200, description: 'Cart item updated.' })
  updateCartItem(@Request() req: RequestWithUser, @Body() body: { item: Record<string, any> }) {
    return this.cartService.updateCartItem(req.user.id, body.item);
  }

  @Delete()
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart.' })
  removeFromCart(@Request() req: RequestWithUser, @Body() body: { serviceId: string }) {
    return this.cartService.removeFromCart(req.user.id, body.serviceId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared.' })
  clearCart(@Request() req: RequestWithUser) {
    return this.cartService.clearCart(req.user.id);
  }
}
