# Cleaning Service Application Checklist


## 1. Project Setup

- [ ] Clone the repository and switch to the intended branch.
- [ ] Install dependencies for `apps/api`, `apps/mobile`, and `apps/provider`.
- [ ] Create local environment files.
- [ ] Configure the database connection and confirm the database is reachable.
- [ ] Confirm the mobile and provider apps use the correct API URL for the local network or deployed environment.
- [ ] Confirm Android SDK, emulator/device, and required Expo/React Native tooling are installed.

## 2. Backend and Database

- [ ] Run Prisma migrations from `apps/api`.
- [ ] Run `npx prisma generate`.
- [ ] Seed the database with test categories, subcategories, services, cities, users, and providers.
- [ ] Verify all required tables and indexes exist.
- [ ] Verify supported cities, categories, service pricing, and provider profiles are populated.
- [ ] Start the API in development mode and confirm the health endpoint responds.
- [ ] Confirm API validation returns useful errors for invalid IDs and malformed requests.
- [ ] Confirm protected endpoints reject missing, expired, and invalid JWTs.
- [ ] Confirm Helmet, CORS, and request logging are configured for the target environment.

## 3. Consumer App

- [ ] Register and log in with the supported authentication flow.
- [ ] Verify profile editing, logout, and session restoration.
- [ ] Select a supported city and browse categories.
- [ ] Verify categories with and without subcategories.
- [ ] Browse services with images, pricing, included items, and excluded items.
- [ ] Add, update, and remove services from the cart.
- [ ] Create, view, reschedule, and cancel a booking.
- [ ] Verify booking status changes: pending, accepted, in progress, completed, and cancelled.
- [ ] Add, edit, select, and delete saved addresses.
- [ ] Verify location permissions and address coordinates where applicable.
- [ ] Start a chat with a provider and send/receive messages.
- [ ] Submit a review after a completed booking.
- [ ] Verify empty states, loading states, retry actions, and API error messages.

## 4. Provider App

- [ ] Register and log in as a provider.
- [ ] Complete and update the provider profile.
- [ ] View available booking requests.
- [ ] Accept or reject a booking.
- [ ] Update booking progress through completion.
- [ ] View schedule, customer details, service details, and location information.
- [ ] Chat with the customer and receive booking notifications.
- [ ] View completed jobs, reviews, earnings, and payout information.
- [ ] Verify provider-facing Hindi translations and readable text on small Android screens.


## 5. Offline-First and Synchronization

- [ ] Open cached services, bookings, and conversations with the device offline.
- [ ] Create or update a booking while offline and verify it is queued locally.
- [ ] Send a chat message while offline and verify it is retried after reconnection.
- [ ] Restore connectivity and confirm pull and push synchronization completes.
- [ ] Verify duplicate sync requests do not create duplicate records.
- [ ] Interrupt a sync and confirm the next attempt resumes safely.
- [ ] Test booking conflicts between local and server changes.
- [ ] Confirm cancellation, completed status, address defaults, and timestamps resolve as expected.
- [ ] Verify the app shows a clear offline or synchronization error state.

## 6. Localization and Accessibility

- [ ] Verify English and Hindi language selection persists after restart.
- [ ] Confirm every visible label, button, validation message, empty state, and notification has a translation.
- [ ] Check Hindi text does not overflow or overlap on small screens.
- [ ] Verify touch targets, contrast, keyboard behavior, and screen-reader labels.
- [ ] Test the main flows on a low-to-mid-range Android device.

