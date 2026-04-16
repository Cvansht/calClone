CREATE TYPE "BookingStatus" AS ENUM ('ACCEPTED', 'CANCELLED', 'RESCHEDULED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Default User',
  "username" TEXT NOT NULL DEFAULT 'admin',
  "email" TEXT NOT NULL,
  "bio" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventType" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "duration" INTEGER NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#0069FF',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "bufferTime" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "EventType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Availability" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Working Hours',
  "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  "isDefault" BOOLEAN NOT NULL DEFAULT true,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AvailabilitySlot" (
  "id" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "availabilityId" TEXT NOT NULL,
  CONSTRAINT "AvailabilitySlot_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Booking" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "status" "BookingStatus" NOT NULL DEFAULT 'ACCEPTED',
  "guestName" TEXT NOT NULL,
  "guestEmail" TEXT NOT NULL,
  "guestNotes" TEXT,
  "cancelReason" TEXT,
  "meetingUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "eventTypeId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "EventType_slug_key" ON "EventType"("slug");
CREATE INDEX "EventType_slug_idx" ON "EventType"("slug");
CREATE INDEX "EventType_userId_idx" ON "EventType"("userId");
CREATE INDEX "Availability_userId_isDefault_idx" ON "Availability"("userId", "isDefault");
CREATE INDEX "AvailabilitySlot_availabilityId_dayOfWeek_idx" ON "AvailabilitySlot"("availabilityId", "dayOfWeek");
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");
CREATE INDEX "Booking_status_idx" ON "Booking"("status");
CREATE INDEX "Booking_eventTypeId_startTime_idx" ON "Booking"("eventTypeId", "startTime");
CREATE UNIQUE INDEX "Booking_eventTypeId_startTime_accepted_key" ON "Booking"("eventTypeId", "startTime") WHERE "status" = 'ACCEPTED';

ALTER TABLE "EventType" ADD CONSTRAINT "EventType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AvailabilitySlot" ADD CONSTRAINT "AvailabilitySlot_availabilityId_fkey" FOREIGN KEY ("availabilityId") REFERENCES "Availability"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "EventType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
