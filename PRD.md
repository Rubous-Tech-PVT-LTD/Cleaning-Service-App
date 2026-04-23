# Product Requirements Document (PRD): Local Service Marketplace

**Version:** 1.0  
**Status:** Draft / For Review  
**Project Owner:** Antigravity AI  

---

## 1. Executive Summary
The **Local Service Marketplace** is a two-sided platform designed to connect urban households with skilled service providers (carpenters, cleaners, electricians, and maids). The primary goal is to provide a seamless, reliable, and secure booking experience that works even in low-connectivity areas, primarily targeting the Indian market with native support for **Hindi**.

## 2. Problem Statement
*   **Users** struggle to find verified, reliable service providers and often face "ghosting" or inconsistent pricing.
*   **Service Providers** (Carpenters, Maids, etc.) lack a platform to manage their schedule, payments, and reputation effectively.
*   **Connectivity issues** in many regions lead to failed bookings or lost data during transit.

## 3. Target Audience & Personas

### 3.1 The Consumer (Suman)
*   **Profile:** Busy professional in a Tier-1 or Tier-2 city.
*   **Need:** Needs a plumber or cleaner at a specific time.
*   **Frustration:** Unclear pricing and lack of trust.
*   **Language:** Primarily uses Hindi or English-mixed (Hinglish).

### 3.2 The Service Provider (Rajesh)
*   **Profile:** Skilled electrician or carpenter.
*   **Need:** Wants more work and timely payments.
*   **Frustration:** Haggling over costs and tracking bookings on paper.
*   **Requirement:** Simple mobile interface in **Hindi**; needs to work offline during site visits.

## 4. Key Functional Requirements

### 4.1 Multilingual Support (Phase 1: Hindi)
*   **Requirement:** The entire interface (labels, messages, buttons) must be available in Hindi.
*   **Implementation:** Use a key-value translation system (i18next) to ensure 100% coverage.

### 4.2 Offline-First Booking & Messaging
*   **Requirement:** Users and providers must be able to view cached service lists, past messages, and create booking requests without an active internet connection.
*   **Sync Logic:** Background synchronization will kick in as soon as the device regains connectivity.

### 4.3 Payment Processing (Razorpay)
*   **Requirement:** Support for UPI, Cards, and Netbanking via Razorpay.
*   **Escrow:** Payment is held by the platform and released to the provider only after the client marks the job as "Complete."

### 4.4 Real-time Chat
*   **Requirement:** Integrated chat between Client and Provider.
*   **Offline capability:** Message history should be cached locally.

## 5. Non-Functional Requirements
*   **Security:** JWT-based authentication with Phone OTP (preferred for the Indian market).
*   **Performance:** App launch takes <2 seconds.
*   **Scalability:** Modular backend built with NestJS to allow scaling from monolithic to microservices.

## 6. User Experience (UX) Principles
*   **Mobile-First:** Optimized for one-handed operation on low-to-mid-range Android devices.
*   **Simplicity:** High-contrast buttons and iconography for easy navigation by less tech-savvy providers.
*   **Transparency:** Clear display of "Service Charge," "Material Cost" (if applicable), and "Final Total."

## 7. Success Metrics (KPIs)
*   **Booking Success Rate:** % of requests that result in a confirmed service.
*   **Payment Success Rate:** Reduction in transaction failures using Razorpay optimizations.
*   **User Retention:** Number of repeat bookings per user over 6 months.

## 8. Risks & Assumptions
*   **Risk:** Slow adoption by service providers who are used to traditional methods.
*   **Mitigation:** Provide a highly simplified "Hindi Interface" and immediate payout options.
*   **Assumption:** Target users have Android smartphones with at least 4GB RAM.
