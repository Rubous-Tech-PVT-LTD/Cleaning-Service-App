import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';
import Category from './Category';
import Subcategory from './Subcategory';

export default class Service extends Model {
  static table = 'services';
  static associations = {
    categories: { type: 'belongs_to', key: 'category_id' },
    subcategories: { type: 'belongs_to', key: 'subcategory_id' },
  } as const;

  @field('category_id') categoryId!: string;
  @field('subcategory_id') subcategoryId?: string;
  @field('name_en') nameEn!: string;
  @field('name_hi') nameHi!: string;
  @field('description_en') descriptionEn?: string;
  @field('description_hi') descriptionHi?: string;
  @field('base_price') basePrice!: number;
  @field('image_url') imageUrl?: string;
  @field('included_items_str') includedItemsStr?: string;
  @field('not_included_items_str') notIncludedItemsStr?: string;
  @field('subcategory_name_en') subcategoryNameEn?: string;

  get includedItems() {
    try {
      return this.includedItemsStr ? JSON.parse(this.includedItemsStr) : [];
    } catch (e) {
      return [];
    }
  }

  get notIncludedItems() {
    try {
      return this.notIncludedItemsStr ? JSON.parse(this.notIncludedItemsStr) : [];
    } catch (e) {
      return [];
    }
  }

  @relation('categories', 'category_id') category!: Relation<Category>;
  @relation('subcategories', 'subcategory_id') subcategory?: Relation<Subcategory>;

  @date('updated_at') updatedAt!: number;
}
