import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ServicesModule } from './services/services.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SyncModule } from './sync/sync.module';
import { PaymentsModule } from './payments/payments.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // requests per minute
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ServicesModule,
    BookingsModule,
    ReviewsModule,
    SyncModule,
    PaymentsModule,
    ChatModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  private readonly logger = new Logger('HTTP');

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply((req: any, res: any, next: () => void) => {
        this.logger.log(`Incoming Request: ${req.method} ${req.url}`);
        next();
      })
      .forRoutes('*');
  }
}
