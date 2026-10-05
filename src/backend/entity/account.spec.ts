import { describe, it, expect } from "vitest";
import { Account, Role } from "./account.entity";

function accountBuilder() {
  return new Account({
    username: "Dorivaldo",
    email: "test@mail.com",
    passwordHash: "@Test123",
    role: Role.USER,
  });
}

describe("Accounts Entity System Test", () => {
  it("Should be possible to create a new account", () => {
    expect(accountBuilder()).toBeTruthy();
  });

  it("should be possible to create an account from another one.", () => {
    const accountOne = accountBuilder();
    expect(new Account(accountOne)).toBeTruthy();
  });
});
