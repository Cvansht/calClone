# CalClone Interview README

This file is written for interview preparation. It explains the project as if you are walking an interviewer through the codebase, defending design decisions, and preparing for a live backend or frontend implementation task.

## 1. Project Pitch

CalClone is a full-stack scheduling platform inspired by Cal.com. It lets an admin create meeting types, define weekly availability, share public booking links, accept guest bookings, and manage reservations from a dashboard.

The implementation follows the assessment stack:

- Frontend: Next.js 14 App Router, React 18, Tailwind CSS, React Hook Form, Zod, react-day-picker, Framer Motion
- Backend: Node.js, Express, TypeScript, Zod, Prisma
- Database: PostgreSQL 15
- ORM: Prisma 5

The most important engineering parts are:

- Timezone-aware slot generation
- Double-booking prevention
- Clean backend layering
- Typed validation on both backend and frontend
- UTC storage for bookings
- A PostgreSQL partial unique index for accepted bookings

## 2. How To Explain The Project In 2 Minutes

I built a Cal.com-style scheduling app with a Next.js frontend and an Express/Prisma/PostgreSQL backend. The app has an admin dashboard for event types, availability, and bookings, plus a public booking page at routes like `/admin/30min`.

The backend is layered as route -> controller -> service -> Prisma. Routes only define endpoints and validation, controllers handle HTTP input/output, services contain business logic, and Prisma handles persistence. This separation makes the core logic easier to test and easier to change.

The core feature is the slot engine. Given an event type, a selected date, and a booker's timezone, it calculates candidate slots from the owner's weekly availability, converts them to UTC, removes past slots, and filters out overlaps with existing accepted bookings.

To prevent double booking, booking creation runs inside a Prisma transaction. It re-checks availability immediately before inserting, checks for overlapping accepted bookings, then creates the booking. The database also has a partial unique index on `(eventTypeId, startTime)` where `status = 'ACCEPTED'`, so cancelled bookings do not block future bookings but accepted duplicates are rejected.

## 3. How To Explain The Project In 5 Minutes

Start with the user flow:

1. Admin creates event types such as "30 Minute Meeting".
2. Admin configures weekly availability like Monday to Friday, 09:00 to 17:00.
3. Guest opens a public link such as `/admin/30min`.
4. Guest selects a date and timezone-aware available slots are fetched from the backend.
5. Guest submits name and email.
6. Backend revalidates the slot and creates a booking.
7. Admin can view upcoming, past, and cancelled bookings.

Then explain architecture:

- Next.js App Router handles dashboard and public pages.
- Custom React hooks call typed API wrappers in `frontend/lib/api.ts`.
- Express exposes REST endpoints under `/api`.
- Zod validates request params, query, and body.
- Services own all business rules.
- Prisma maps TypeScript code to PostgreSQL tables.

Then explain the hardest part:

The slot engine stores bookings in UTC but treats availability as a local weekly template. This matters because "Monday 09:00" is not a universal instant; it depends on the owner's timezone. The code converts availability windows into UTC candidate instants, then filters them for the booker's selected local day.

Finally explain data integrity:

The app does not trust the frontend. Even if the frontend shows a slot as available, the backend checks again inside the transaction before creating the booking.

## 4. Running The Project

PostgreSQL runs on host port `5433` to avoid conflicts with a local PostgreSQL service on `5432`.

```bash
npm install
npm run db:up
npm run db:migrate
npm run db:seed
npm run dev
```

Useful URLs:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`
- Public booking page: `http://localhost:3000/admin/30min`
- API event types: `http://localhost:4000/api/event-types`

## 5. Important File Map

Backend:

- `backend/prisma/schema.prisma`: database models
- `backend/prisma/migrations/.../migration.sql`: SQL migration, including the partial unique index
- `backend/prisma/seed.ts`: default user, event types, availability, and sample bookings
- `backend/src/app.ts`: Express app setup and middleware
- `backend/src/server.ts`: server entrypoint and default availability bootstrapping
- `backend/src/routes`: REST route definitions
- `backend/src/controllers`: HTTP request/response layer
- `backend/src/services`: business logic
- `backend/src/services/slots.service.ts`: slot calculation engine
- `backend/src/services/booking.service.ts`: booking creation, cancellation, listing
- `backend/src/middleware/validate.ts`: Zod request validation
- `backend/src/middleware/errorHandler.ts`: central error responses

Frontend:

- `frontend/app`: Next.js App Router pages and layouts
- `frontend/app/dashboard`: admin dashboard routes
- `frontend/app/[username]/[slug]`: public booking page
- `frontend/components/event-types`: event type UI
- `frontend/components/availability`: weekly availability UI
- `frontend/components/booking`: public booking flow and confirmation
- `frontend/components/bookings`: bookings dashboard
- `frontend/hooks`: server-state hooks using `useState` and `useEffect`
- `frontend/lib/api.ts`: Axios instance and typed API wrappers
- `frontend/types/index.ts`: shared frontend TypeScript types

## 6. Database Design

### User

There is one default user because the assessment does not require authentication.

Important fields:

- `id`: default user id is `default-user`
- `username`: used in public booking URLs
- `timezone`: owner timezone, default `Asia/Kolkata`

Why this design:

- It keeps the app close to a real scheduling product while avoiding auth complexity.
- If auth is added later, the existing `userId` foreign keys already support multiple users.

### EventType

An event type is a bookable meeting template.

Important fields:

- `title`
- `slug`
- `duration`
- `color`
- `isActive`
- `bufferTime`
- `userId`

Why `slug` is unique:

- Public links depend on slugs.
- Duplicate slugs would make `/admin/30min` ambiguous.

Why soft delete with `isActive`:

- Old bookings should still reference the event type.
- A hard delete could remove historical context.
- Public pages only show active event types.

### Availability and AvailabilitySlot

Availability is a weekly schedule. AvailabilitySlot stores day-of-week windows such as Monday 09:00 to 17:00.

Why store `startTime` and `endTime` as `HH:MM` strings:

- Weekly availability is not a specific date-time instant.
- "09:00 Monday" must be interpreted in the owner's timezone.
- Storing it as a DateTime would incorrectly attach it to one specific date.

Why replace all slots on save:

- The schedule is small, usually at most 7 days with a few ranges.
- Replace semantics are simpler than diffing added, removed, and edited slots.
- It runs inside a transaction, so the schedule is never half-saved.

### Booking

A booking is an actual reserved time interval.

Important fields:

- `startTime`: UTC DateTime
- `endTime`: UTC DateTime
- `status`: `ACCEPTED`, `CANCELLED`, `RESCHEDULED`
- `guestName`
- `guestEmail`
- `eventTypeId`
- `userId`

Why bookings are stored in UTC:

- UTC is unambiguous.
- It avoids server timezone issues.
- The frontend can display the same booking in the user's timezone.

## 7. Indexing And Double-Booking Protection

Indexes:

- `Booking_startTime_idx`
- `Booking_status_idx`
- `Booking_eventTypeId_startTime_idx`
- `EventType_slug_idx`
- `EventType_userId_idx`

The special one is:

```sql
CREATE UNIQUE INDEX "Booking_eventTypeId_startTime_accepted_key"
ON "Booking"("eventTypeId", "startTime")
WHERE "status" = 'ACCEPTED';
```

Why a partial unique index:

- Accepted bookings should not duplicate the same event type and start time.
- Cancelled bookings should not permanently block a time.
- Prisma schema cannot directly express this partial index, so it is added in the SQL migration.

Important interview point:

Application checks are necessary but not enough under concurrency. Two requests can arrive at the same time. The backend checks conflicts inside a transaction, and the database unique index provides a final safety net for duplicate accepted starts.

## 8. Backend Architecture

### Request Pipeline

Every request roughly flows through:

1. `cors`
2. `helmet`
3. `express.json`
4. `morgan`
5. API router
6. Zod validation middleware
7. Controller
8. Service
9. Prisma
10. Error handler

### Why Route -> Controller -> Service -> Prisma

I chose this structure because each layer has one job:

- Routes define URLs and attach validation.
- Controllers translate HTTP to service calls.
- Services contain business rules.
- Prisma is the database access layer.

Why not put everything in routes:

- Routes would become hard to test.
- HTTP concerns and business logic would be mixed.
- Adding another interface, such as a job queue or CLI, would require copying logic.

Why keep Prisma mostly inside services:

- It keeps database assumptions out of controllers.
- It makes service functions the single place to reason about booking rules.

## 9. API Endpoints

Event types:

- `GET /api/event-types`
- `POST /api/event-types`
- `GET /api/event-types/:id`
- `PATCH /api/event-types/:id`
- `DELETE /api/event-types/:id`

Availability:

- `GET /api/availability`
- `PUT /api/availability`

Bookings:

- `GET /api/bookings?status=upcoming|past|cancelled&page=1&limit=10`
- `GET /api/bookings/:id`
- `DELETE /api/bookings/:id`

Public:

- `GET /api/public/:username/:slug`
- `GET /api/public/:username/:slug/slots?date=YYYY-MM-DD&timezone=IANA`
- `POST /api/public/:username/:slug/book`
- `GET /api/public/booking/:id/confirm`

## 10. Core Feature Deep Dive: Event Types

Main backend files:

- `backend/src/routes/eventTypes.ts`
- `backend/src/controllers/eventTypes.controller.ts`
- `backend/src/services/eventType.service.ts`
- `backend/src/schemas/eventType.schema.ts`

Main frontend files:

- `frontend/components/event-types/EventTypesDashboard.tsx`
- `frontend/components/event-types/EventTypeCard.tsx`
- `frontend/components/event-types/EventTypeForm.tsx`

Flow:

1. Frontend submits event type form.
2. React Hook Form and Zod validate title, slug, duration, color, and buffer.
3. API wrapper calls `POST /api/event-types`.
4. Backend Zod validates again.
5. Service checks slug uniqueness.
6. Prisma creates the event type.

Why validate on frontend and backend:

- Frontend validation improves user experience.
- Backend validation protects the API from invalid or malicious requests.
- Never rely only on frontend validation.

Why slug uniqueness is checked in service and also in database:

- Service check gives a nicer error message.
- Database unique constraint is the final source of truth.

## 11. Core Feature Deep Dive: Availability

Main backend files:

- `backend/src/services/availability.service.ts`
- `backend/src/services/defaultData.service.ts`

Main frontend file:

- `frontend/components/availability/AvailabilityForm.tsx`

Flow:

1. Backend ensures a default user and default availability exist.
2. Frontend loads availability with `GET /api/availability`.
3. Admin edits enabled days, start time, end time, and timezone.
4. Frontend saves with `PUT /api/availability`.
5. Backend deletes old slots and creates new slots inside a transaction.

Why this approach:

- Weekly availability is compact.
- Transactional replace is simple and reliable.
- If something fails, old data is not partially overwritten.

Why not generate and store all future slots:

- Future slots would be huge and always changing.
- Availability rules are easier to store as templates.
- Slots should be calculated dynamically because bookings and timezones affect availability.

## 12. Core Feature Deep Dive: Slot Calculation

Main file:

- `backend/src/services/slots.service.ts`

Inputs:

- username
- event type slug
- selected date
- booker timezone

Output:

```ts
Array<{
  startTime: string;
  endTime: string;
}>
```

Both values are ISO strings in UTC.

High-level algorithm:

1. Find the public event type and owner.
2. Load the owner's default availability.
3. Treat the requested date as a booker-local day.
4. Convert the booker-local day to a UTC start and end range.
5. Find the owner-local dates touched by that UTC range.
6. For each owner-local date, get matching availability slots by day of week.
7. Generate candidate slots using `duration + bufferTime`.
8. Keep only candidates that fall inside the booker's selected day.
9. Fetch accepted bookings overlapping the candidate range.
10. Remove candidates that overlap existing bookings.
11. Remove candidates earlier than now plus 10 minutes.
12. Return available UTC slots.

Important overlap formula:

```ts
candidateStart < existingEnd && candidateEnd > existingStart
```

Why this formula:

- It catches partial overlaps, exact overlaps, and contained intervals.
- It allows back-to-back meetings because if one meeting ends exactly when another starts, the condition is false.

Why return UTC to the frontend:

- UTC is stable and unambiguous.
- The frontend can format it in the booker's local timezone.

Why not calculate slots only on the frontend:

- The frontend cannot be trusted.
- The backend must know about existing bookings.
- Timezone and conflict logic belongs close to the database.

## 13. Core Feature Deep Dive: Booking Creation

Main file:

- `backend/src/services/booking.service.ts`

Flow:

1. Parse requested `startTime`.
2. Start Prisma transaction.
3. Find public event type.
4. Recompute available slots.
5. Confirm requested slot is still available.
6. Check accepted booking overlaps.
7. Create booking.
8. Generate meeting URL.
9. Return booking with event type and user.

Why recompute slots during booking:

- The frontend may have stale slot data.
- Another user may have booked the slot seconds earlier.
- Rechecking is necessary for correctness.

Why use a transaction:

- Conflict check and insert should be treated as one logical operation.
- It reduces race conditions.
- It keeps related DB work grouped.

Why also use a database unique index:

- Transactions reduce race conditions, but the database should enforce the strongest invariant it can.
- The database is the final line of defense.

## 14. Core Feature Deep Dive: Bookings Dashboard

Main files:

- `backend/src/services/booking.service.ts`
- `frontend/hooks/useBookings.ts`
- `frontend/components/bookings/BookingTable.tsx`

Supported tabs:

- Upcoming
- Past
- Cancelled

Backend filtering:

- Upcoming: accepted bookings where `startTime >= now`
- Past: accepted bookings where `endTime < now`
- Cancelled: bookings where status is `CANCELLED`

Why pagination:

- The API supports `page` and `limit`.
- The UI shows pagination when there are more than 10 bookings.
- This keeps the table usable as data grows.

Why cancellation updates status instead of deleting:

- Historical record is preserved.
- Cancelled bookings no longer block the partial unique index.
- The dashboard can show cancellation history.

## 15. Frontend Architecture

The frontend uses Next.js App Router.

Routes:

- `/`: redirects to `/dashboard`
- `/dashboard`: event types dashboard
- `/dashboard/event-types/new`: create event type
- `/dashboard/event-types/[id]/edit`: edit event type
- `/dashboard/availability`: availability settings
- `/dashboard/bookings`: bookings dashboard
- `/[username]/[slug]`: public booking page
- `/[username]/[slug]/success`: confirmation page

Why App Router:

- It matches the assessment requirement.
- File-based routing keeps page structure obvious.
- Public booking pages can be server-routed but still use client-side interactivity.

Why no Redux or Zustand:

- State is mostly local component state and server data.
- The app is small enough that global state would add unnecessary complexity.
- Custom hooks provide loading, error, data, and refetch behavior.

Why Axios API wrappers:

- Components do not need to know endpoint strings.
- API response shapes are typed.
- Error handling is centralized.

## 16. Frontend Public Booking Flow

Main file:

- `frontend/components/booking/PublicBookingFlow.tsx`

Flow:

1. Load event details.
2. Detect booker timezone with `Intl.DateTimeFormat().resolvedOptions().timeZone`.
3. Disable past dates and days with no availability.
4. On date select, fetch slots.
5. On slot select, show guest form.
6. Validate form with React Hook Form and Zod.
7. Submit booking.
8. On success, redirect to confirmation page.
9. On conflict, show error and refresh slots.

Why use Framer Motion:

- It gives smooth slot and form transitions.
- The public booking flow feels closer to Cal.com.

## 17. Why PostgreSQL Instead Of MongoDB

Since I know MERN, this is a likely interview question.

Short answer:

I chose PostgreSQL because scheduling is relational and consistency-heavy. Event types, users, availability, and bookings have clear relationships, and booking correctness depends on transactions and constraints.

Detailed answer:

- Bookings need ACID guarantees.
- Foreign keys keep event type and booking relationships valid.
- Indexes are important for time-range queries.
- A partial unique index helps prevent duplicate accepted bookings.
- Prisma gives typed database access while still letting us use SQL features in migrations.

Could MongoDB work?

Yes, but I would need to design transactions and uniqueness carefully. MongoDB supports transactions, but PostgreSQL is a natural fit for this relational scheduling domain.

## 18. Why Express Instead Of Next.js API Routes

The assignment explicitly asked for Node.js and Express. Keeping Express separate also has benefits:

- Clear separation between frontend and backend.
- Backend can be deployed independently to Railway or Render.
- Express route/controller/service structure is familiar and easy to test.
- It mirrors real-world teams where frontend and backend are separate services.

Next.js API routes would reduce the number of deployable services, but it would not follow the requested architecture as closely.

## 19. Why Prisma Instead Of Raw SQL

Prisma gives:

- Type-safe queries
- Schema-managed migrations
- Easy relation includes
- Better developer productivity
- Cleaner service code

Why not only Prisma schema:

- Prisma cannot model PostgreSQL partial unique indexes directly.
- For that case, the SQL migration adds the exact index needed.

## 20. Why Zod

Zod is used for request validation on the backend and form validation on the frontend.

Benefits:

- Runtime validation, not just TypeScript compile-time checks
- Clear error messages
- Shared validation style across frontend and backend
- Safer API boundaries

Important interview point:

TypeScript disappears at runtime. Zod protects runtime inputs.

## 21. Likely Interview Questions And Strong Answers

### Q1. Walk me through the backend architecture.

Answer:

The backend follows route -> controller -> service -> Prisma. Routes define endpoints and validation, controllers handle request and response details, services contain business logic, and Prisma handles database access. This keeps the code testable and prevents business logic from being scattered across route handlers.

### Q2. How does slot calculation work?

Answer:

The slot engine starts from the owner's weekly availability. It converts the booker's selected date into a UTC day range, finds the owner-local dates touched by that range, generates candidate slots from availability windows using event duration and buffer time, then removes past slots and slots overlapping accepted bookings. It returns UTC ISO strings that the frontend displays in the booker's timezone.

### Q3. Why store bookings in UTC?

Answer:

UTC is timezone-neutral. If we stored local times, the same booking could mean different instants depending on server timezone, owner timezone, or guest timezone. UTC makes storage consistent, and display formatting happens at the edge.

### Q4. How do you prevent double booking?

Answer:

The frontend only shows available slots, but the backend still re-checks availability during booking creation. Inside a Prisma transaction, it recomputes availability, checks for overlaps, and then inserts the booking. The database also has a partial unique index for accepted bookings with the same event type and start time.

### Q5. What is the overlap condition?

Answer:

Two intervals overlap if `candidateStart < existingEnd && candidateEnd > existingStart`. This handles all real overlaps but still allows back-to-back meetings where one ends exactly when another starts.

### Q6. Why soft delete event types?

Answer:

Because old bookings should keep their relationship to the event type. If we hard delete an event type, historical booking rows lose context. Soft delete also prevents public booking while preserving dashboard history.

### Q7. Why delete and recreate availability slots?

Answer:

The availability schedule is small, so replacing all slots is simpler and less error-prone than calculating a diff. It is done inside a transaction, so the schedule is updated atomically.

### Q8. Why not Redux?

Answer:

The app does not have complex shared client state. Server data is loaded through custom hooks, form state lives in React Hook Form, and UI state stays local. Redux would add complexity without much benefit.

### Q9. What would you improve with more time?

Answer:

I would add authentication, email notifications, rescheduling, date overrides, multiple schedules per user, custom booking questions, and deeper integration tests around concurrent booking attempts.

### Q10. Where are the most important tests?

Answer:

The slot engine is the highest-risk logic, so there is a unit test for candidate slot generation. If extending the project, I would add service tests for booking conflicts and API integration tests for public booking.

## 22. Possible Backend Live Coding Tasks

### Task: Add booking search by guest name or email

Files likely touched:

- `backend/src/schemas/booking.schema.ts`
- `backend/src/services/booking.service.ts`
- `frontend/lib/api.ts`
- `frontend/hooks/useBookings.ts`
- `frontend/components/bookings/BookingTable.tsx`

Approach:

1. Add `search` to the booking query schema.
2. Pass search into `listBookings`.
3. Add Prisma `OR` filter on guest name and guest email.
4. Add frontend search input.
5. Reset page to 1 when search changes.

Prisma idea:

```ts
if (search) {
  where.OR = [
    { guestName: { contains: search, mode: "insensitive" } },
    { guestEmail: { contains: search, mode: "insensitive" } }
  ];
}
```

### Task: Add reschedule booking endpoint

Files likely touched:

- `backend/src/schemas/booking.schema.ts`
- `backend/src/routes/bookings.ts`
- `backend/src/controllers/bookings.controller.ts`
- `backend/src/services/booking.service.ts`

Approach:

1. Create `PATCH /api/bookings/:id/reschedule`.
2. Validate new `startTime`.
3. Load existing booking and event type.
4. Calculate new end time from duration.
5. Check conflict using same overlap logic.
6. Mark old booking as `RESCHEDULED` or update the same row depending on product decision.

Good interview comment:

I would prefer creating a new accepted booking and marking the old one as rescheduled, because it preserves history.

### Task: Add date override support

Files likely touched:

- Prisma schema
- Slot service
- Availability UI

Approach:

1. Add `DateOverride` model with specific date and custom slots or blocked flag.
2. In slot service, check override before weekly availability.
3. If blocked, return no slots.
4. If custom slots, generate candidates from override slots instead of weekly slots.

### Task: Add backend validation to prevent overlapping availability slots

Files likely touched:

- `backend/src/schemas/availability.schema.ts`
- `backend/src/services/availability.service.ts`

Approach:

1. Group slots by `dayOfWeek`.
2. Sort by start time.
3. Compare each slot with the previous slot.
4. Reject if `current.start < previous.end`.

### Task: Add API integration test for double booking

Files likely touched:

- `backend/tests`

Approach:

1. Seed or create event type and availability.
2. Book a slot once.
3. Try booking the same slot again.
4. Expect HTTP 409.

## 23. Possible Frontend Live Coding Tasks

### Task: Add a booking search box

Approach:

1. Add `search` state in `BookingTable`.
2. Pass it to `useBookings`.
3. Update API wrapper to include query param.
4. Reset pagination on search change.

### Task: Add toast after copying public link

Current behavior:

- The card changes text to `Copied`.

Possible improvement:

- Add a small toast component or temporary fixed notification.

Files:

- `frontend/components/event-types/EventTypeCard.tsx`

### Task: Add a new field to event type form

Example: location.

Approach:

1. Add field in Prisma schema.
2. Migrate database.
3. Update backend Zod schema.
4. Update service create/update data.
5. Update frontend type.
6. Add React Hook Form input.
7. Display it on public booking page.

### Task: Add loading skeletons

Approach:

1. Find loading branches in hooks/pages.
2. Replace plain text with skeleton blocks.
3. Keep dimensions stable to avoid layout shift.

### Task: Add "copy meeting URL" on confirmation

Approach:

1. Add button in `ConfirmationCard`.
2. Use `navigator.clipboard.writeText`.
3. Show copied state.

## 24. Live Coding Strategy

If asked to implement a backend feature:

1. Start from the API contract.
2. Add or update Zod schema.
3. Add service logic.
4. Add controller function.
5. Add route.
6. Update frontend API wrapper if needed.
7. Run typecheck.

If asked to implement a frontend feature:

1. Find the component that owns the UI.
2. Check if data comes from a hook.
3. Update API wrapper if request shape changes.
4. Add local state only where needed.
5. Keep validation in React Hook Form and Zod for forms.
6. Run typecheck and build.

## 25. Common Mistakes To Avoid In The Interview

- Do not say frontend availability checks are enough.
- Do not ignore timezone conversion.
- Do not say TypeScript validates runtime API input.
- Do not say cancelled bookings should still block a slot.
- Do not hard delete event types without discussing historical bookings.
- Do not implement business logic directly inside route handlers.
- Do not store weekly availability as absolute DateTime values.

## 26. What Is Complete From The Assessment

Core requirements:

- Next.js 14 App Router frontend
- Express backend
- PostgreSQL and Prisma
- User, EventType, Availability, AvailabilitySlot, Booking schema
- Seed default user, event types, availability, and bookings
- Event type CRUD
- Availability get and replace
- Public event info endpoint
- Public slots endpoint
- Public booking endpoint
- Booking confirmation endpoint
- Booking dashboard
- Slot calculation with duration, buffer, timezone, conflicts, and past slot filtering
- Prisma transaction for booking creation
- Partial unique index for accepted booking duplicate prevention
- Zod validation middleware
- Central error handler
- Responsive dashboard shell

Bonus or extra implemented:

- Buffer time support
- Generated meeting URL
- Mobile navigation
- Booking pagination
- Add-to-calendar link
- React Hook Form and Zod frontend forms

Not implemented because they are roadmap bonus items:

- Email notifications
- Rescheduling endpoint and UI
- Date overrides
- Multiple schedules
- Custom booking questions
- Authentication

## 27. Verification Commands

Use these before an interview:

```bash
npm run typecheck -w backend
npm run typecheck -w frontend
npm run test -w backend
npm run build -w backend
npm run build -w frontend
```

Useful smoke checks:

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/event-types
```

Browser checks:

- `http://localhost:3000/dashboard`
- `http://localhost:3000/dashboard/availability`
- `http://localhost:3000/dashboard/bookings`
- `http://localhost:3000/admin/30min`

## 28. Final Interview Framing

If the interviewer asks "what was the hardest part?", talk about the slot engine and double-booking prevention.

If they ask "what would you improve?", talk about auth, email notifications, rescheduling, date overrides, and integration tests for concurrency.

If they ask "why this stack when you know MERN?", say that the Express and React skills transfer directly, but PostgreSQL is a stronger fit for scheduling because of relational data, transactions, indexes, and constraints.

If they ask "where would you start debugging a booking issue?", say:

1. Check public slot endpoint response.
2. Check booking request payload.
3. Check `booking.service.ts` revalidation.
4. Check existing bookings in PostgreSQL.
5. Check timezone formatting between frontend and backend.
