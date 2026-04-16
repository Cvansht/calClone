# CalClone

Full-stack scheduling platform built from the assignment architecture document.

For a detailed project explanation, design rationale, and interview preparation notes, read [INTERVIEW_README.md](./INTERVIEW_README.md).

## Stack

- Frontend: Next.js 14 App Router, React 18, Tailwind CSS, react-day-picker, Framer Motion, Axios
- Backend: Node 20, Express 4, Prisma 5, PostgreSQL 15, Zod validation
- Database: PostgreSQL with a partial unique index to prevent duplicate accepted bookings per event type and start time

## What is implemented

- Event type CRUD with slug uniqueness, duration, color, buffer time, soft delete, and copyable public links
- Availability editor with a default weekly schedule, timezone selection, and replace-in-transaction persistence
- Public booking page at `/admin/:slug` with host panel, calendar, slot grid, guest form, conflict handling, and confirmation page
- Bookings dashboard with Upcoming, Past, and Cancelled tabs, cancellation dialog, and pagination
- React Hook Form + Zod validation on event type and public booking forms
- Timezone-aware slot generation using owner availability and UTC booking storage
- Prisma transaction around public booking creation with a final conflict re-check before insert

## Local Setup

1. Copy env files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

2. Install dependencies:

```bash
npm install
```

3. Start PostgreSQL:

```bash
npm run db:up
```

The container listens on `localhost:5433` on the host to avoid conflicts with an existing local PostgreSQL service on `5432`.

4. Generate Prisma client, migrate, and seed:

```bash
npm run generate
npm run db:migrate
npm run db:seed
```

5. Run both apps:

```bash
npm run dev
```

Frontend: `http://localhost:3000`

Backend health check: `http://localhost:4000/api/health`

Default public booking page: `http://localhost:3000/admin/30min`

## API Reference

### Event Types

- `GET /api/event-types`
- `POST /api/event-types`
- `GET /api/event-types/:id`
- `PATCH /api/event-types/:id`
- `DELETE /api/event-types/:id`

### Availability

- `GET /api/availability`
- `PUT /api/availability`

### Bookings

- `GET /api/bookings?status=upcoming|past|cancelled&page=1&limit=10`
- `GET /api/bookings/:id`
- `DELETE /api/bookings/:id`

### Public Booking

- `GET /api/public/:username/:slug`
- `GET /api/public/:username/:slug/slots?date=YYYY-MM-DD&timezone=Asia/Kolkata`
- `POST /api/public/:username/:slug/book`
- `GET /api/public/booking/:id/confirm`

## Notes

- This is a single-user scheduling system. Admin APIs operate against `DEFAULT_USER_ID`, defaulting to `default-user`.
- Bookings are stored in UTC and displayed in the relevant timezone on the frontend.
- Prisma cannot express PostgreSQL partial indexes directly in the schema, so the migration adds `Booking_eventTypeId_startTime_accepted_key` manually.

## Bonus Features Implemented

- Responsive dashboard shell with mobile navigation
- Buffer time support in the schema, event form, and slot calculation engine
- Generated meeting URL on booking creation
