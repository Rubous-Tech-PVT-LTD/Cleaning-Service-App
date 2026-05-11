import { Model } from '@nozbe/watermelondb';
import { field, readonly, date } from '@nozbe/watermelondb/decorators';

export default class Message extends Model {
  static table = 'messages';

  @field('chat_id') chatId!: string;
  @field('sender_id') senderId!: string;
  @field('content') content!: string;
  
  @readonly @date('created_at') createdAt!: number;
}
