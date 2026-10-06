import { describe, it, expect } from "vitest";
import { Room } from "./room";

describe("Room Entity System Test", () => {
  it("Should be possible to create a room entity", () => {
    expect(
      new Room({
        title: "Test Room",
        description: "Test Description",
        participants: [],
        date: new Date(),
        resource: [],
        duration: 0,
      }),
    ).toBeTruthy();
  });

  it("should support custom maxDurationMinutes", () => {
    const room = new Room({
      title: "Test Room",
      description: "Test Description",
      participants: [],
      date: new Date(),
      maxDurationMinutes: 120,
      resource: [],
      duration: 60,
    });
    expect(room.maxDurationMinutes).toBe(120);
    expect(room.duration).toBe(60);

    const clone = new Room(room);
    expect(clone.maxDurationMinutes).toBe(120);
  });

  it("should default maxDurationMinutes to 240 if not provided", () => {
    const room = new Room({
      title: "Test Room",
      description: "Test Description",
      participants: [],
      date: new Date(),
      resource: [],
      duration: 30,
    });
    expect(room.maxDurationMinutes).toBe(240);
  });
});
