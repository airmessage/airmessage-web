import {
  isValidPhoneNumber as libIsValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";

const regexEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

/**
 * Gets if a string is a valid email address
 */
export function isValidEmailAddress(value: string): boolean {
  return !!value.match(regexEmail);
}

/**
 * Gets if a string is valid phone number
 */
export function isValidPhoneNumber(value: string): boolean {
  return libIsValidPhoneNumber(value, "US");
}

/**
 * Gets if a string is valid address
 */
export function isValidAddress(value: string): boolean {
  return isValidEmailAddress(value) || isValidPhoneNumber(value);
}

/**
 * Normalizes an address
 */
export function normalizeAddress(value: string): string {
  //Format phone numbers as E164
  const phoneNumber = parsePhoneNumberFromString(value, "US");
  if (phoneNumber?.isValid()) {
    return phoneNumber.format("E.164");
  }

  //Email addresses can't be formatted
  return value;
}
