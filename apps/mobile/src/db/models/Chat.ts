import { Model } from '@nozbe/watermelondb';
import { field, readonly, date, children } from '@nozbe/watermelondb/decorators';

export default class Chat extends Model {
  static table = 'chats';

  static associations = {
    messages: { type: 'has_many', foreignKey: 'chat_id' },
  } as const;

  @field('booking_id') bookingId!: string;
  @field('client_id') clientId!: string;
  @field('provider_id') providerId!: string;

  @children('messages') messages!: any;

  @readonly @date('updated_at') updatedAt!: number;
}
