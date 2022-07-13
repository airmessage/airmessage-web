import { parsePhoneNumberFromString } from "libphonenumber-js";

export enum AddressType {
  Email = "email",
  Phone = "phone",
}

export interface AddressData {
  value: string;
  displayValue: string;
  label?: string;
  type: AddressType;
}

export interface PersonData {
  id: string;
  name?: string;
  avatar?: string;
  addresses: AddressData[];
}

export abstract class PeopleUtils {
  abstract initialize(): void;

  abstract getPeople(): Promise<PersonData[]>;

  abstract findPerson(address: string): Promise<PersonData>;
}

let peopleUtils: PeopleUtils;
export function setPeopleUtils(value: PeopleUtils) {
  peopleUtils = value;
}
export function getPeopleUtils() {
  return peopleUtils;
}

//Contacts that were previously queried for, for quick access
const contactCacheMap: Map<string, PersonData> = new Map();
const contactFailedArray: string[] = [];

export function initializePeople() {
  if (!peopleUtils) return;
  peopleUtils.initialize();
}

export function getPeople(): Promise<PersonData[]> {
  if (!peopleUtils)
    return Promise.reject(new Error("No people handler assigned"));
  else return peopleUtils.getPeople();
}

export function findPerson(address: string): Promise<PersonData> {
  if (!peopleUtils)
    return Promise.reject(new Error("No people handler assigned"));

  //Formatting the address
  if (!address.includes("@")) {
    const phone = parsePhoneNumberFromString(address);
    if (phone) address = phone.number.toString();
  }

  //Checking if the address exists in the cache
  const cacheContact = contactCacheMap.get(address);
  if (cacheContact) return Promise.resolve(cacheContact);

  //Checking if the contact wasn't previously found
  if (contactFailedArray.includes(address)) {
    //Rejecting the promise
    return Promise.reject(new Error("Contact " + address + " not found"));
  }

  //Finding the person
  return peopleUtils
    .findPerson(address)
    .then((contact) => {
      //Adding the contact to the cache
      contactCacheMap.set(address, contact);

      //Continue promise chain
      return contact;
    })
    .catch((error) => {
      //Adding the contact to the failed array
      contactFailedArray.push(address);

      //Continue promise chain
      throw error;
    });
}
