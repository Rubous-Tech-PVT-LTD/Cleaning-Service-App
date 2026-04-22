# Project Architecture Diagrams

This document contains all the visual representations of the Local Service Marketplace architecture and data flows.

## 1. High-Level System Architecture
This diagram shows the relationship between the offline-first mobile client, the modular backend, and external integrations.

```mermaid
graph TD
    subgraph "Clients (Offline-First)"
        MA["Mobile App (React Native + WatermelonDB)"]
        WD["Web Dashboard (Next.js)"]
    end

    subgraph "Backend (Modular Monolith)"
        CoreAPI["Node.js / NestJS API"]
        AuthModule["Auth & User Management"]
        SyncModule["Offline Sync Logic"]
        BookingModule["Booking & Scheduling"]
        PaymentModule["Razorpay Integration"]
    <ctrl95>

    subgraph "Data Storage"
        Postgres[("PostgreSQL")]
        Redis[("Redis Cache")]
    end

    subgraph "External Services"
        Firebase["Firebase FCM"]
        Razorpay["Razorpay Gateway"]
        S3["AWS S3"]
    end

    MA <--> CoreAPI
    WD --> CoreAPI
    CoreAPI --> Postgres
    CoreAPI --> Redis
    CoreAPI --> Razorpay
```

## 2. Entity Relationship Diagram (ERD)
This diagram details how the database tables interact with one another.

```mermaid
erDiagram
    USER ||--o| PROFILE : "has"
    USER ||--o{ BOOKING : "places/receives"
    USER ||--o{ MESSAGE : "sends"
    
    SERVICE ||--o{ BOOKING : "offered_in"
    
    BOOKING ||--o| PAYMENT : "generates"
    BOOKING ||--o{ REVIEW : "receives"
    
    CHAT ||--o{ MESSAGE : "contains"
    USER ||--o{ CHAT : "participates_in"
```

## 3. Feature Map (Entity Interaction)
*Based on the project overview diagram provided.*

```mermaid
graph LR
    User --> Profile
    User --> Booking
    User --> Chat
    User --> Message
    
    Service --> Booking
    
    Booking --> Payment
    Booking --> Review
    
    Chat --> Message
    
    style User fill:#222,stroke:#555,color:#fff
    style Service fill:#222,stroke:#555,color:#fff
    style Booking fill:#222,stroke:#555,color:#fff
    style Payment fill:#222,stroke:#555,color:#fff
    style Review fill:#222,stroke:#555,color:#fff
    style Chat fill:#222,stroke:#555,color:#fff
```

## 4. Offline Sync Flow
How the app handles data when connectivity is lost.

```mermaid
sequenceDiagram
    participant App as Mobile App (Offline)
    participant LocalDB as WatermelonDB
    participant Server as NestJS API
    
    App->>LocalDB: Save Booking Request
    Note over App,LocalDB: Data stored with Local ID
    App-->>App: Monitor Connectivity...
    Note over App: Online!
    App->>Server: Push Sync Queue
    Server->>Server: Validate & Process
    Server-->>App: Sync Success (Server ID assigned)
```
