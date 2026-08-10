# Cleaning Service Application

After pulling the latest changes:

1. Navigate to the API:
   cd apps/api

2. Apply the latest Prisma migrations:
   npx prisma migrate dev

3. Generate Prisma Client:
   npx prisma generate

4. Seed the Database

```bash
npx prisma db seeed
```

5. Start the Backend Server

```bash
npm run start
```

6. Then Start the mobile application


## Edge Cases Handled

1. **Category without subcategories** – User is directly redirected to the service list.

2. **Subcategory without services** – Displays a proper empty-state message.

3. **Service without subcategory** – Supports services linked directly to a category using an optional `subcategoryId`.

4. **Invalid category/subcategory ID** – API validates IDs and returns `404 Not Found`.

5. **Duplicate subcategory slug** – Database uniqueness constraint prevents duplicate slugs.

6. **Subcategory with existing services** – Deletion is prevented to avoid accidental data loss.

7. **Empty subcategory list** – Mobile app displays a user-friendly empty state.

8. **Duplicate sync records** – Sync uses an upsert approach to update existing records instead of creating duplicates.

9. **Partial sync failure** – Incremental sync using `lastPulledAt` allows the process to retry safely.


