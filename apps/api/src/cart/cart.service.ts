import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto, CartBookingType } from './dto/add-to-cart.dto';
import { PricingService } from '../pricing/pricing.service';

@Injectable()
export class CartService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricingService: PricingService
  ) {}

  private async validateServiceId(serviceId: string): Promise<void> {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        status: true,
        durationType: true,
        estimatedTime: true
      }
    });

    if (!service) {
      throw new BadRequestException(`Service with ID ${serviceId} does not exist`);
    }

    if (service.status !== 'ACTIVE') {
      throw new BadRequestException(`Service ${serviceId} is not available`);
    }
  }

  async getCart(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      let cart = await this.prisma.cart.findUnique({
        where: { userId },
        include: {
          cartItems: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: {
            userId,
            items: [],
          },
          include: {
            cartItems: true,
          },
        });
      }

      // Transform cart items to the format expected by the frontend
      const transformedCart = {
        ...cart,
        items: cart.cartItems.map((item) => ({
          serviceId: item.serviceId,
          type: item.type,
          title: item.title,
          quantity: item.quantity,
          price: Number(item.price),
          bookingType: item.bookingType,
          scheduledAt: item.scheduledAt?.toISOString(),
          duration: item.duration,
          schedule: item.schedule,
        })),
      };

      return transformedCart;
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        // Unique constraint violation - cart might be created by another request
        return await this.prisma.cart.findUnique({
          where: { userId },
          include: {
            cartItems: {
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
        });
      }
      throw new BadRequestException('Failed to retrieve cart. Please try again.');
    }
  }

  private normalizeCartItem(dto: AddToCartDto): Record<string, any> {
    const { item, bookingType, schedule } = dto;

    if (!item?.serviceId) {
      throw new BadRequestException('item.serviceId is required');
    }

    const base: Record<string, any> = {
      ...item,
      quantity: item.quantity || 1,
      bookingType,
    };

    if (bookingType === CartBookingType.INSTANT) {
      delete base.schedule;
      delete base.scheduledAt;
      return {
        ...base,
        bookingType: CartBookingType.INSTANT,
      };
    }

    if (!schedule?.dateISO || !schedule?.time) {
      throw new BadRequestException(
        'schedule.dateISO and schedule.time are required for scheduled bookings',
      );
    }

    return {
      ...base,
      bookingType: CartBookingType.SCHEDULED,
      schedule: {
        dateId: schedule.dateId,
        dateLabel: schedule.dateLabel,
        dayLabel: schedule.dayLabel,
        dateISO: schedule.dateISO,
        time: schedule.time,
      },
      scheduledAt: this.buildScheduledAt(schedule.dateISO, schedule.time),
    };
  }

  private buildScheduledAt(dateISO: string, timeLabel: string): string {
    const match = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
      return new Date(`${dateISO}T00:00:00`).toISOString();
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    const date = new Date(`${dateISO}T00:00:00`);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  }

  async addToCart(userId: string, dto: AddToCartDto) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // Validate service exists and is active
        await this.validateServiceId(dto.item.serviceId);

        // Calculate price using PricingService based on duration
        const calculatedPrice = await this.pricingService.calculatePrice(
          dto.item.serviceId, 
          dto.item.duration
        );

        const normalizedItem = this.normalizeCartItem(dto);
        
        // Set price to server-calculated price
        normalizedItem.price = calculatedPrice;

        let cart = await tx.cart.findUnique({
          where: { userId },
        });

        if (!cart) {
          cart = await tx.cart.create({
            data: {
              userId,
              items: [],
            },
          });
        }

        // For hourly services, remove existing hourly cart items
        if (normalizedItem.type === 'hourly') {
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
              type: 'hourly',
            },
          });
        }

        // Check if cart item already exists
        const existingCartItem = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            serviceId: normalizedItem.serviceId,
            type: normalizedItem.type,
          },
        });

        if (existingCartItem) {
          // Update existing cart item
          // If duration or booking type changed, preserve quantity (it's a duration update)
          // Otherwise increment quantity (it's adding more of the same item)
          const isDurationUpdate = 
            JSON.stringify(normalizedItem.duration) !== JSON.stringify(existingCartItem.duration) ||
            normalizedItem.bookingType !== existingCartItem.bookingType;

          return tx.cartItem.update({
            where: { id: existingCartItem.id },
            data: {
              quantity: isDurationUpdate ? existingCartItem.quantity : existingCartItem.quantity + (normalizedItem.quantity || 1),
              price: calculatedPrice,
              bookingType: normalizedItem.bookingType,
              scheduledAt: normalizedItem.scheduledAt ? new Date(normalizedItem.scheduledAt) : null,
              duration: normalizedItem.duration,
              schedule: normalizedItem.schedule,
            },
          });
        } else {
          // Create new cart item
          const newCartItem = await tx.cartItem.create({
            data: {
              cartId: cart.id,
              serviceId: normalizedItem.serviceId,
              type: normalizedItem.type,
              title: normalizedItem.title,
              quantity: normalizedItem.quantity,
              price: calculatedPrice,
              bookingType: normalizedItem.bookingType,
              scheduledAt: normalizedItem.scheduledAt ? new Date(normalizedItem.scheduledAt) : null,
              duration: normalizedItem.duration,
              schedule: normalizedItem.schedule,
            },
          });

          // Return cart with items array for compatibility
          return {
            ...cart,
            items: [newCartItem],
          };
        }
      });
    } catch (error) {
      throw new BadRequestException('Failed to add item to cart. Please try again.');
    }
  }

  async updateCartItem(userId: string, item: Record<string, any>) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId },
        });

        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        // Validate service exists
        await this.validateServiceId(item.serviceId);

        // Calculate price using PricingService based on duration
        const calculatedPrice = await this.pricingService.calculatePrice(
          item.serviceId, 
          item.duration
        );

        const existingCartItem = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            serviceId: item.serviceId,
            type: item.type,
          },
        });

        if (existingCartItem) {
          return tx.cartItem.update({
            where: { id: existingCartItem.id },
            data: {
              quantity: item.quantity || existingCartItem.quantity,
              price: calculatedPrice,
              bookingType: item.bookingType,
              scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
              duration: item.duration,
              schedule: item.schedule,
            },
          });
        } else {
          const newCartItem = await tx.cartItem.create({
            data: {
              cartId: cart.id,
              serviceId: item.serviceId,
              type: item.type,
              title: item.title,
              quantity: item.quantity || 1,
              price: calculatedPrice,
              bookingType: item.bookingType,
              scheduledAt: item.scheduledAt ? new Date(item.scheduledAt) : null,
              duration: item.duration,
              schedule: item.schedule,
            },
          });

          // Return cart with items array for compatibility
          return {
            ...cart,
            items: [newCartItem],
          };
        }
      });
    } catch (error) {
      throw new BadRequestException('Failed to update cart item. Please try again.');
    }
  }

  async removeFromCart(userId: string, serviceId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    if (!serviceId) {
      throw new BadRequestException('serviceId is required');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId },
        });

        if (!cart) {
          throw new NotFoundException('Cart not found');
        }

        // For hourly service, remove all hourly items
        if (serviceId === 'hourly-service') {
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
              type: 'hourly',
            },
          });
        } else {
          await tx.cartItem.deleteMany({
            where: {
              cartId: cart.id,
              serviceId: serviceId,
            },
          });
        }

        return cart;
      });
    } catch (error) {
      throw new BadRequestException('Failed to remove item from cart. Please try again.');
    }
  }

  async clearCart(userId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        let cart = await tx.cart.findUnique({
          where: { userId },
        });

        if (!cart) {
          cart = await tx.cart.create({
            data: {
              userId,
              items: [],
            },
          });
        }

        // Delete all cart items for this cart
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id },
        });

        return cart;
      });
    } catch (error) {
      throw new BadRequestException('Failed to clear cart. Please try again.');
    }
  }
}
