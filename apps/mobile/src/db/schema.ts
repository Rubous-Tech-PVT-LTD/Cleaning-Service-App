import { appSchema, tableSchema } from '@nozbe/watermelondb';

export default appSchema({
  version: 4,
  tables: [
    tableSchema({
      name: 'categories',
      columns: [
        { name: 'name_en', type: 'string' },
        { name: 'name_hi', type: 'string' },
        { name: 'icon_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'services',
      columns: [
        { name: 'category_id', type: 'string', isIndexed: true },
        { name: 'name_en', type: 'string' },
        { name: 'name_hi', type: 'string' },
        { name: 'base_price', type: 'number' },
        { name: 'image_url', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'bookings',
      columns: [
        { name: 'service_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string', isIndexed: true },
        { name: 'provider_id', type: 'string', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'scheduled_at', type: 'number' },
        { name: 'total_price', type: 'number' },
        { name: 'items', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'messages',
      columns: [
        { name: 'chat_id', type: 'string', isIndexed: true },
        { name: 'sender_id', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'chats',
      columns: [
        { name: 'booking_id', type: 'string', isIndexed: true },
        { name: 'client_id', type: 'string' },
        { name: 'provider_id', type: 'string' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'reviews',
      columns: [
        { name: 'booking_id', type: 'string', isIndexed: true },
        { name: 'rating', type: 'number' },
        { name: 'comment', type: 'string', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'addresses',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'label', type: 'string' },
        { name: 'address_line1', type: 'string' },
        { name: 'address_line2', type: 'string', isOptional: true },
        { name: 'city', type: 'string' },
        { name: 'state', type: 'string' },
        { name: 'pincode', type: 'string' },
        { name: 'is_default', type: 'boolean' },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
  ],
});

