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

  it("should be possible to create an room entity from another one.", () => {
    const room = new Room({
      title: "Test Room",
      description: "Test Description",
      participants: [],
      date: new Date(),
      resource: [],
      duration: 0,
    });
    expect(new Room(room)).toBeTruthy();
  });
});
