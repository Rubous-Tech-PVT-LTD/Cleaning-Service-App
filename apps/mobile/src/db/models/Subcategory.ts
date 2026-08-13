import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';
import Category from './Category';

export default class Subcategory extends Model {
  static table = 'subcategories';
  static associations = {
    categories: { type: 'belongs_to', key: 'category_id' },
  } as const;

  @field('category_id') categoryId!: string;
  @field('name_en') nameEn!: string;
  @field('name_hi') nameHi!: string;
  @field('icon_url') iconUrl?: string;

  @relation('categories', 'category_id') category!: Relation<Category>;

  @date('updated_at') updatedAt!: number;
}
