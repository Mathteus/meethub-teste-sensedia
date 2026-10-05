import z, { safeParse } from "zod";

const emailSchema = z.email();

export class EmailInvalid extends Error {
  constructor() {
    super("Email Invalid!");
  }
}

export class Email {
  private _data: string;

  constructor(emailToValidate: string | Email) {
    if (emailToValidate instanceof Email) {
      this._data = emailToValidate.data;
      return;
    }

    const validate = safeParse(emailSchema, emailToValidate);
    if (validate.success) {
      this._data = validate.data;
      return;
    }

    throw new EmailInvalid();
  }

  get data(): string {
    return this.data;
  }
}
