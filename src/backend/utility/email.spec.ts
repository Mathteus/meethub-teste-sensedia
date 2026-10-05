import { Email } from "./email";
import { describe, it, expect } from "vitest";

describe("tests for the email class", () => {
  it("should be possible to create an instance.", () => {
    expect(new Email("test@mail.com")).toBeTruthy();
  });

  it("should generate an instance creation error", () => {
    expect(() => new Email("testl.com")).toThrow();
  });
});
