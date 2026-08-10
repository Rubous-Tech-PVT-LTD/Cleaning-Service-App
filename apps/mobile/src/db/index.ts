import { Database } from '@nozbe/watermelondb';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';

import schema from './schema';
import Category from './models/Category';
import Subcategory from './models/Subcategory';
import Service from './models/Service';
import Booking from './models/Booking';
import Message from './models/Message';
import Chat from './models/Chat';
import Review from './models/Review';
import Address from './models/Address';

const adapter = new LokiJSAdapter({
  schema,
  useWebWorker: false,
  useIncrementalIndexedDB: false,
  dbName: 'LocalMarketplaceDB',
});

export const database = new Database({
  adapter,
  modelClasses: [
    Category,
    Subcategory,
    Service,
    Booking,
    Message,
    Chat,
    Review,
    Address,
  ],
});

// Helper function to get categories sorted by order
export const getCategoriesSorted = async () => {
  const categories = await database.get('categories').query().fetch();
  return categories.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
};
