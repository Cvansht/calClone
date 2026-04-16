import { generateCandidateSlots, getAvailableSlotsForEvent } from "../src/services/slots.service";

describe("generateCandidateSlots", () => {
  it("generates duration-sized UTC slots with buffer time", () => {
    const slots = generateCandidateSlots(
      "2026-04-15",
      [{ dayOfWeek: 3, startTime: "09:00", endTime: "10:30" }],
      30,
      15,
      "Asia/Kolkata"
    );

    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({
      startTime: "2026-04-15T03:30:00.000Z",
      endTime: "2026-04-15T04:00:00.000Z"
    });
    expect(slots[1]).toEqual({
      startTime: "2026-04-15T04:15:00.000Z",
      endTime: "2026-04-15T04:45:00.000Z"
    });
  });

  it("returns owner slots that fall inside the booker's selected local day", async () => {
    const eventType = {
      id: "event-1",
      title: "30 Minute Meeting",
      slug: "30min",
      description: null,
      duration: 30,
      color: "#0069FF",
      isActive: true,
      bufferTime: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "default-user",
      user: {
        id: "default-user",
        name: "Default User",
        username: "admin",
        email: "admin@calclone.dev",
        bio: null,
        timezone: "Asia/Kolkata",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    const client = {
      availability: {
        findFirst: jest.fn().mockResolvedValue({
          timezone: "Asia/Kolkata",
          slots: [{ dayOfWeek: 3, startTime: "09:00", endTime: "09:30" }]
        })
      },
      booking: {
        findMany: jest.fn().mockResolvedValue([])
      }
    };

    const slots = await getAvailableSlotsForEvent(
      eventType,
      "2026-04-14",
      "America/New_York",
      client as never,
      new Date("2026-04-14T00:00:00.000Z")
    );

    expect(slots).toEqual([
      {
        startTime: "2026-04-15T03:30:00.000Z",
        endTime: "2026-04-15T04:00:00.000Z"
      }
    ]);
  });
});
