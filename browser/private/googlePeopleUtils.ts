import {AddressData, AddressType, ContactData, PeopleUtils, PersonData} from "shared/util/peopleUtils";
import * as secrets from "shared/secrets";
import {formatAddress} from "shared/util/conversationUtils";
import {googleScope} from "shared/constants";

//All contacts loaded from Google
let initializationPromise: Promise<any> | undefined;
let personArray: PersonData[] | undefined;
let contactMap: Map<string, ContactData> | undefined;

export default class GooglePeopleUtils extends PeopleUtils {
	initialize(): void {
		initializationPromise = new Promise((resolve, reject) => {
			gapi.load("client", () => {
				gapi.client.init({
					apiKey: secrets.googleApiKey,
					discoveryDocs: ["https://people.googleapis.com/$discovery/rest?version=v1"],
					clientId: secrets.googleClientID,
					scope: googleScope
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
	
	async getPeople(): Promise<PersonData[]> {
		//Waiting for contact data to be loaded
		if(!initializationPromise) throw new Error("Contacts not requested");
		await initializationPromise;
		if(!personArray) throw new Error("Contacts not loaded");
		
		//Returning the people
		return personArray;
	}
	
	async findPerson(address: string): Promise<ContactData> {
		//Waiting for contact data to be loaded
		if(!initializationPromise) throw new Error("Contacts not requested");
		await initializationPromise;
		if(!contactMap) throw new Error("Contacts not loaded");
		
		//Searching for the person in the map
		const contact = contactMap.get(address);
		if(contact) return contact;
		else throw new Error("Contact " + address + " not found");
	}
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