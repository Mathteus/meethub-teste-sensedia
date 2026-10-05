import { randomUUIDv7 } from "bun";
import { Password } from "../utility/password";
import { Replace } from "../utility";

export enum Role {
  USER = "USER",
  ADMIN = "ADMIN",
}

export interface IAccount {
  id: string;
  email: string;
  username: string;
  passwordHash: Password | string;
  role: Role;
  createdAt: Date;
}

interface IAccountCreate {
  id?: string;
  createdAt?: Date;
  role?: Role;
}

export class Account {
  private _id: string;
  private _username: string;
  private _email: string;
  private _passwordHash: Password;
  private _role: Role;
  private _createdAt: Date;

  constructor(account: Replace<IAccount, IAccountCreate> | Account) {
    if (account instanceof Account) {
      this._id = account.id;
      this._username = account.username;
      this._email = account.email;
      this._passwordHash = account.passwordHash;
      this._role = account.role;
      this._createdAt = account.createdAt;
      return;
    }

    this._id = account.id || randomUUIDv7();
    this._username = account.username;
    this._email = account.email;
    this._passwordHash = new Password(account.passwordHash);
    this._role = account.role || Role.USER;
    this._createdAt = account.createdAt || new Date();
  }

  get id() {
    return this._id;
  }

  get username() {
    return this._username;
  }

  get email() {
    return this._email;
  }

  get passwordHash() {
    return this._passwordHash;
  }

  get role() {
    return this._role;
  }

  get createdAt() {
    return this._createdAt;
  }
}
