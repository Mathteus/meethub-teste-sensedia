import { describe, it, expect } from 'vitest';
import { ConfigPassword, Password } from './password';

const standardConfigPassword: ConfigPassword = {
  maxLength: 20,
  minUppers: 1,
  minLowers: 1,
  minLength: 3,
  minNumbers: 1,
  minSymbols: 1,
};

function fabricPassword(
  value: string,
  config: ConfigPassword = standardConfigPassword,
) {
  return new Password({
    value,
    config,
  });
}

describe('Tests for Password class', () => {
  it('should be possible to create a instance', () => {
    expect(fabricPassword('@Qwerty123')).toBeTruthy();
  });

  it('should be possible to generate an error', () => {
    expect(() => fabricPassword('as')).toThrow();
  });

  it('should be possible to create a password with just string value', () => {
    expect(new Password('@Test123')).toBeTruthy();
  });

  it('should generate an error when attempting to create a password using just string value.', () => {
    expect(() => new Password('test13')).toThrow();
  });

  it('should be possible to confirm the password hash', async () => {
    const pass = fabricPassword('@Qwerty123');
    await pass.hashPassword();
    expect(async () => await pass.comparePassword('@Qwerty123')).toBeTruthy();
  });
});
