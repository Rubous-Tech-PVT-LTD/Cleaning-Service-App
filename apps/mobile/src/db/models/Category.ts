import { Model } from '@nozbe/watermelondb';
import { field, children, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Category extends Model {
  static table = 'categories';

  @field('name_en') nameEn!: string;
  @field('name_hi') nameHi!: string;
  @field('icon_url') iconUrl?: string;
  @field('order') order!: number;
  @field('has_subcategories') hasSubcategories!: boolean;
  
  @children('services') services!: any;
  @children('subcategories') subcategories!: any;

  @date('updated_at') updatedAt!: number;
}
