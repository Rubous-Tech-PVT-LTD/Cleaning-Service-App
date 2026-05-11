import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';
import Service from './Service';

export default class Booking extends Model {
  static table = 'bookings';
  static associations = {
    services: { type: 'belongs_to', key: 'service_id' },
  } as const;

  @field('service_id') serviceId!: string;
  @field('client_id') clientId!: string;
  @field('provider_id') providerId?: string;
  @field('status') status!: string;
  @field('scheduled_at') scheduledAt!: number;
  @field('total_price') totalPrice!: number;
  @field('items') items?: string;
  @readonly @date('created_at') createdAt!: number;

  @relation('services', 'service_id') service!: Relation<Service>;

  @readonly @date('updated_at') updatedAt!: number;
}
