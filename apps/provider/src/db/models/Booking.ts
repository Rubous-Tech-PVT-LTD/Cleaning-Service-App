import { Model, Relation } from '@nozbe/watermelondb';
import { field, relation, readonly, date } from '@nozbe/watermelondb/decorators';
import Service from './Service';
import Address from './Address';

export default class Booking extends Model {
  static table = 'bookings';
  static associations = {
    services: { type: 'belongs_to', key: 'service_id' },
    addresses: { type: 'belongs_to', key: 'address_id' },
  } as const;

  @field('service_id') serviceId!: string;
  @field('client_id') clientId!: string;
  @field('provider_id') providerId?: string;
  @field('address_id') addressId!: string;
  @field('status') status!: string;
  @field('scheduled_at') scheduledAt!: number;
  @field('total_price') totalPrice!: number;
  @field('items') items?: string;
  @field('otp') otp?: string;
  @date('created_at') createdAt!: number;

  @relation('services', 'service_id') service!: Relation<Service>;
  @relation('addresses', 'address_id') address!: Relation<Address>;

  @date('updated_at') updatedAt!: number;
}
