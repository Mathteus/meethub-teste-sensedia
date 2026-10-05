import { randomUUIDv7 } from "bun";
import { Replace } from "../utility";
import { Recurces, type IRoom } from "./room.types";

export { Recurces };
export type { IRoom };

export class Room {
  private _id: string;
  private _title: string;
  private _description: string;
  private _participants: string[];
  private _date: Date;
  private _resource: Recurces[];
  private _duration: number;

  constructor(room: Replace<IRoom, { id?: string }> | Room) {
    if (room instanceof Room) {
      this._id = room._id;
      this._title = room._title;
      this._description = room._description;
      this._participants = room._participants;
      this._date = room._date;
      this._resource = room._resource;
      this._duration = room._duration;
      return;
    }

    this._id = room.id || randomUUIDv7();
    this._title = room.title;
    this._description = room.description;
    this._participants = room.participants;
    this._date = room.date;
    this._resource = room.resource;
    this._duration = room.duration;
  }

  get id(): string {
    return this._id;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get participants(): string[] {
    return this._participants;
  }

  get date(): Date {
    return this._date;
  }

  get resource(): Recurces[] {
    return this._resource;
  }

  get duration(): number {
    return this._duration;
  }
}
