import * as config from "../secure/config";
import {parsePhoneNumberFromString} from "libphonenumber-js";
import {formatAddress} from "./conversationUtils";

export enum AddressType {
	Email,
	Phone
}

export interface AddressData {
	value: string;
	displayValue: string;
	label?: string;
	type: AddressType;
}

export interface PersonData {
	name?: string;
	avatar?: string;
	addresses: AddressData[];
}

export interface ContactData {
	name?: string;
	avatar?: string;
}

//All contacts loaded from Google
let initializationPromise: Promise<any> | undefined;
let personArray: PersonData[] | undefined;
let contactMap: Map<string, ContactData> | undefined;

//Contacts that were previously queried for, for quick access
let contactCacheMap: Map<string, ContactData> = new Map();
let contactFailedArray: string[] = [];

export function initializePeople() {
	initializationPromise = new Promise((resolve, reject) => {
		gapi.load('client', () => {
			gapi.client.init({
				apiKey: config.googleApiKey,
				discoveryDocs: ["https://people.googleapis.com/$discovery/rest?version=v1"],
				clientId: config.googleClientID,
				scope: config.googleScope
			}).then(() => {
					//Loading contacts
					loadPeople().then((data) => {
						console.log("Loaded " + data.personArray.length + " contacts (" + data.contactMap.size + " addresses)");
						personArray = data.personArray;
						contactMap = data.contactMap;
						
						resolve(undefined);
					}).catch((error) => {
						console.warn("Error loading Google people", error);
					});
				}).catch((error) => {
					console.warn("Error initializing GAPI client", error);
				});
		});
	});
}

async function loadPeople(): Promise<{personArray: PersonData[], contactMap: Map<string, ContactData>}> {
	//Creating the return values
	const personArray: PersonData[] = [];
	const contactMap: Map<string, ContactData> = new Map();
	
	let nextPageToken: string | undefined = undefined;
	let requestIndex = 0;
	do {
		//Sleeping every 2 requests
		if(requestIndex > 0 && requestIndex % 2 === 0) {
			await new Promise(r => setTimeout(r, 1000));
		}
		
		//Fetching contacts from Google
		const parameters = {
			resourceName: "people/me",
			personFields: "names,photos,emailAddresses,phoneNumbers",
			pageToken: nextPageToken,
			pageSize: 1000,
			sortOrder: "FIRST_NAME_ASCENDING",
			sources: ["READ_SOURCE_TYPE_CONTACT"]
		} as gapi.client.people.people.connections.ListParameters;
		const response = await gapi.client.people.people.connections.list(parameters);
		
		//Ignoring if the request failed
		if(!response.result.connections) break;
		
		//Iterating over the retrieved people
		for(const person of response.result.connections) {
			//Reading the person data
			const personData = googlePersonToPersonData(person);
			
			//Adding the person to the array
			personArray.push(personData);
			
			//Sorting the person's information with their address as the key
			for(const address of personData.addresses) {
				if(contactMap.has(address.value)) continue;
				contactMap.set(address.value, personData);
			}
		}
		
		//Setting the next page token
		nextPageToken = response.result.nextPageToken;
		
		//Logging the event
		console.log("Loaded contacts request index " + requestIndex + " / " + nextPageToken);
		
		//Incrementing the request index
		requestIndex++;
	} while(nextPageToken);
	
	//Returning the data
	return {personArray: personArray, contactMap: contactMap};
}

export async function getPeople(): Promise<PersonData[]> {
	//Waiting for contact data to be loaded
	if(!initializationPromise) return Promise.reject("Contacts not requested");
	await initializationPromise;
	if(!personArray) return Promise.reject("Contacts not loaded");
	
	//Returning the people
	return personArray;
}

export async function findPerson(address: string): Promise<ContactData> {
	//Formatting the address
	if(!address.includes("@")) {
		const phone = parsePhoneNumberFromString(address);
		if(phone) address = phone.number.toString();
	}
	
	//Waiting for contact data to be loaded
	if(!initializationPromise) return Promise.reject("Contacts not requested");
	await initializationPromise;
	if(!contactMap) return Promise.reject("Contacts not loaded");
	
	let contact: ContactData | undefined;
	
	//Checking if the address exists in the cache
	contact = contactCacheMap.get(address);
	if(contact) return contact;
	
	//Checking if the contact wasn't previously found
	if(contactFailedArray.includes(address)) {
		//Rejecting the promise
		return Promise.reject("Contact " + address + " not found");
	}
	
	//Finding the contact in the map
	contact = contactMap.get(address);
	if(contact) {
		//Removing the contact from the map
		contactMap.delete(address);
		
		//Adding the contact to the cache
		contactCacheMap.set(address, contact);
		
		//Returning the contact
		return contact;
	} else {
		//Adding the contact to the failed array
		contactFailedArray.push(address);
		
		//Rejecting the promise
		return Promise.reject("Contact " + address + " not found");
	}
}

function googlePersonToPersonData(person: gapi.client.people.Person): PersonData {
	const name = person.names?.[0].displayName;
	const avatar = person.photos?.[0]?.url;
	const addresses: AddressData[] = [
		...person.emailAddresses?.reduce((accumulator: AddressData[], address) => {
			if(address.value !== undefined) {
				accumulator.push({value: address.value, displayValue: address.value, label: address.formattedType, type: AddressType.Email});
			}
			return accumulator;
		}, []) ?? [],
		...person.phoneNumbers?.reduce((accumulator: AddressData[], address) => {
			if(address.canonicalForm !== undefined) {
				accumulator.push({value: address.canonicalForm, displayValue: formatAddress(address.canonicalForm), label: address.formattedType, type: AddressType.Phone});
			}
			return accumulator;
		}, []) ?? [],
	];
	
	return {
		name: name,
		avatar: avatar,
		addresses: addresses
	} as PersonData;
}