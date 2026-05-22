import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Review extends Model {
  static table = 'reviews';

  @field('booking_id') bookingId: any;
  @field('rating') rating: any;
  @field('comment') comment: any;

  @date('created_at') createdAt: any;
  @date('updated_at') updatedAt: any;
}
