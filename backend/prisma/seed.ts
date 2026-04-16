import { PrismaClient } from "@prisma/client";
import { addDays, addMinutes } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

const defaultUserId = process.env.DEFAULT_USER_ID ?? "default-user";
const ownerTimezone = "Asia/Kolkata";

function zonedDateTime(dayOffset: number, time: string) {
  const date = formatInTimeZone(addDays(new Date(), dayOffset), ownerTimezone, "yyyy-MM-dd");
  return fromZonedTime(`${date}T${time}:00`, ownerTimezone);
}

async function main() {
  await prisma.booking.deleteMany();
  await prisma.availabilitySlot.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.eventType.deleteMany();

  const user = await prisma.user.upsert({
    where: { id: defaultUserId },
    update: {
      name: "Default User",
      username: "admin",
      email: "admin@calclone.dev",
      bio: "Scheduling focused conversations from India.",
      timezone: ownerTimezone
    },
    create: {
      id: defaultUserId,
      name: "Default User",
      username: "admin",
      email: "admin@calclone.dev",
      bio: "Scheduling focused conversations from India.",
      timezone: ownerTimezone
    }
  });

  const eventTypes = await Promise.all([
    prisma.eventType.create({
      data: {
        title: "30 Minute Meeting",
        slug: "30min",
        description: "A focused meeting for planning, reviews, and decisions.",
        duration: 30,
        color: "#0069FF",
        userId: user.id
      }
    }),
    prisma.eventType.create({
      data: {
        title: "60 Minute Call",
        slug: "60min",
        description: "A longer session for deeper technical or product work.",
        duration: 60,
        color: "#10B981",
        userId: user.id
      }
    }),
    prisma.eventType.create({
      data: {
        title: "Quick Sync 15min",
        slug: "15min",
        description: "A short sync for quick updates.",
        duration: 15,
        color: "#F59E0B",
        userId: user.id
      }
    })
  ]);

  const availability = await prisma.availability.create({
    data: {
      name: "Working Hours",
      timezone: ownerTimezone,
      isDefault: true,
      userId: user.id,
      slots: {
        create: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00"
        }))
      }
    }
  });

  const sampleBookings = [
    { dayOffset: 1, time: "10:00", guestName: "Aarav Mehta", guestEmail: "aarav@example.com", eventType: eventTypes[0] },
    { dayOffset: 2, time: "11:00", guestName: "Neha Rao", guestEmail: "neha@example.com", eventType: eventTypes[1] },
    { dayOffset: 3, time: "15:30", guestName: "Kabir Singh", guestEmail: "kabir@example.com", eventType: eventTypes[2] },
    { dayOffset: -1, time: "14:00", guestName: "Maya Iyer", guestEmail: "maya@example.com", eventType: eventTypes[0] },
    { dayOffset: -2, time: "16:00", guestName: "Dev Patel", guestEmail: "dev@example.com", eventType: eventTypes[1] }
  ];

  for (const booking of sampleBookings) {
    const startTime = zonedDateTime(booking.dayOffset, booking.time);
    const endTime = addMinutes(startTime, booking.eventType.duration);
    await prisma.booking.create({
      data: {
        title: `${booking.guestName} + ${booking.eventType.title}`,
        startTime,
        endTime,
        status: "ACCEPTED",
        guestName: booking.guestName,
        guestEmail: booking.guestEmail,
        guestNotes: "Seed booking for dashboard preview.",
        meetingUrl: `https://meet.calclone.local/${booking.eventType.slug}-${booking.time.replace(":", "")}`,
        eventTypeId: booking.eventType.id,
        userId: user.id
      }
    });
  }

  console.log(`Seeded ${user.username}, ${eventTypes.length} event types, availability ${availability.id}, and ${sampleBookings.length} bookings.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
