import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Address extends Model {
  static table = 'addresses';

  @field('user_id') userId: any;
  @field('label') label: any;
  @field('address_line1') addressLine1: any;
  @field('address_line2') addressLine2: any;
  @field('city') city: any;
  @field('state') state: any;
  @field('pincode') pincode: any;
  @field('is_default') isDefault: any;
  @field('latitude') latitude: any;
  @field('longitude') longitude: any;

  @date('created_at') createdAt: any;
  @date('updated_at') updatedAt: any;
}
