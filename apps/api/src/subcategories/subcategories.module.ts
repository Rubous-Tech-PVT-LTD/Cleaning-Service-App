import { Module } from '@nestjs/common';
import { SubcategoriesService } from './subcategories.service';
import { SubcategoriesController } from './subcategories.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubcategoriesController],
  providers: [SubcategoriesService],
  exports: [SubcategoriesService]
})
export class SubcategoriesModule {}
