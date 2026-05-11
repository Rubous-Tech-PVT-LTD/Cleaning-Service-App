import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';
import Category from './Category';

export default class Service extends Model {
  static table = 'services';
  static associations = {
    categories: { type: 'belongs_to', key: 'category_id' },
  } as const;

  @field('category_id') categoryId!: string;
  @field('name_en') nameEn!: string;
  @field('name_hi') nameHi!: string;
  @field('base_price') basePrice!: number;
  @field('image_url') imageUrl?: string;

  @relation('categories', 'category_id') category!: Relation<Category>;

  @readonly @date('updated_at') updatedAt!: number;
}
