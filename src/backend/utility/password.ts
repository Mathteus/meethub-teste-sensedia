export type ConfigPassword = {
  minLength: number;
  maxLength: number;
  minUppers: number;
  minLowers: number;
  minNumbers: number;
  minSymbols: number;
};

export interface IPassword {
  value: string;
  config: ConfigPassword;
}

function countCharacters(text: string) {
  const uppers = (text.match(/[A-Z]/g) || []).length;
  const lowers = (text.match(/[a-z]/g) || []).length;
  const numbers = (text.match(/[0-9]/g) || []).length;
  const symbols = (text.match(/[!@#$%^&*()_+\-=[\]{};':",./<>?|\\~`]/g) || [])
    .length;

  return {
    uppers,
    lowers,
    numbers,
    symbols,
    length: text.length,
  };
}

export class Password {
  private _data: string;
  private _config: ConfigPassword;

  constructor(props: IPassword | Password | string) {
    if (props instanceof Password) {
      this._config = props.config;
      this._data = props.data;
      return;
    }

    if (typeof props === "string") {
      this._config = {
        minLength: 3,
        maxLength: 20,
        minUppers: 1,
        minLowers: 1,
        minNumbers: 1,
        minSymbols: 1,
      };
      this.validatePassword(props);
      this._data = props;
      return;
    }

    this._config = props.config;
    this.validatePassword(props.value);
    this._data = props.value;
  }

  async hashPassword() {
    if (
      typeof (globalThis as any).Bun !== "undefined" &&
      (globalThis as any).Bun.password
    ) {
      this._data = await (globalThis as any).Bun.password.hash(this._data);
      return;
    }
    const crypto = await import("node:crypto");
    this._data = crypto.createHash("sha256").update(this._data).digest("hex");
  }

  async comparePassword(plainOrHashed: string) {
    if (
      typeof (globalThis as any).Bun !== "undefined" &&
      (globalThis as any).Bun.password
    ) {
      return await (globalThis as any).Bun.password.verify(plainOrHashed, this._data);
    }
    const crypto = await import("node:crypto");
    const hashed = crypto.createHash("sha256").update(plainOrHashed).digest("hex");
    return hashed === this._data || plainOrHashed === this._data;
  }

  private validatePassword(toValidate: string) {
    const statics = countCharacters(toValidate);

    if (statics.length < this._config.minLength) {
      throw new Error(
        `Password must be at least ${this._config.minLength} characters long`,
      );
    }

    if (statics.length > this._config.maxLength) {
      throw new Error(
        `Password must be at most ${this._config.maxLength} characters long`,
      );
    }

    if (statics.lowers < this._config.minLowers) {
      throw new Error("Password must contain at least one lowercase letter");
    }

    if (statics.uppers < this._config.minUppers) {
      throw new Error("Password must contain at least one uppercase letter");
    }

    if (statics.numbers < this._config.minNumbers) {
      throw new Error("Password must contain at least one number");
    }

    if (statics.symbols < this._config.minSymbols) {
      throw new Error("Password must contain at least one symbol");
    }
  }

  get data() {
    return this._data;
  }

  get config() {
    return this._config;
  }
}
