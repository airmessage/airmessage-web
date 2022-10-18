import {AddressData, AddressType, PeopleNoPermissionError, PersonData} from "shared/interface/people/peopleUtils";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {formatAddress} from "shared/util/conversationUtils";
import {parsePhoneNumberFromString} from "libphonenumber-js";
import {useCancellableEffect} from "shared/util/hookUtils";

export interface PeopleState {
	needsPermission: boolean,
	getPerson(address: string): PersonData | undefined;
	allPeople: PersonData[] | undefined;
}

export const PeopleContext = React.createContext<PeopleState>({
	needsPermission: false,
	getPerson: () => undefined,
	allPeople: undefined
});

export function PeopleContextProvider(props: {
	children?: React.ReactNode;
	ready?: boolean;
}) {
	const [needsPermission, setNeedsPermission] = useState(false);
	const [peopleData, setPeopleData] = useState<LoadedPeopleData | undefined>(undefined);
	
	const ready = props.ready;
	useCancellableEffect((addPromise) => {
		if(!ready) return;
		addPromise(gapiLoadPeople())
			.then(setPeopleData)
			.catch((error) => {
				if(error instanceof PeopleNoPermissionError) {
					setNeedsPermission(true);
				} else {
					console.warn(`Failed to load people: ${error}`);
				}
			});
	}, [ready, setPeopleData]);
	
	const getPerson = useCallback((address: string): PersonData | undefined => {
		//Check if people are loaded
		if(peopleData === undefined) {
			return undefined;
		}
		
		//Format the address
		let formattedAddress = address;
		if(!address.includes("@")) {
			const phone = parsePhoneNumberFromString(address);
			if(phone !== undefined) formattedAddress = phone.number.toString();
		}
		
		return peopleData.personMap.get(formattedAddress);
	}, [peopleData]);
	
	return (
		<PeopleContext.Provider value={{
			needsPermission: needsPermission,
			getPerson: getPerson,
			allPeople: peopleData?.personArray
		}}>
			{props.children}
		</PeopleContext.Provider>
	);
}

class GAPIPeopleError extends Error {
	readonly response: gapi.client.HttpRequestRejected;
	constructor(response: gapi.client.HttpRequestRejected) {
		super(response.body);
		this.response = response;
	}
}

interface LoadedPeopleData {
	personArray: PersonData[];
	personMap: Map<string, PersonData>;
}

async function gapiLoadPeople(): Promise<LoadedPeopleData> {
	//Creating the return values
	const personArray: PersonData[] = [];
	const contactMap = new Map<string, PersonData>();
	
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
		
		let response: gapi.client.HttpRequestFulfilled<gapi.client.people.people.connections.Response>;
		try {
			response = await gapi.client.people.people.connections.list(parameters);
		} catch(error) {
			const response = error as gapi.client.HttpRequestRejected;
			if(response.status === 401 || response.status === 403) {
				throw new PeopleNoPermissionError();
			} else {
				throw new GAPIPeopleError(response);
			}
		}
		
		//Exit if there are no more connections
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
	return {
		personArray: personArray,
		personMap: contactMap
	};
}

function googlePersonToPersonData(person: gapi.client.people.Person): PersonData {
	const id = person.resourceName;
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
		id: id,
		name: name,
		avatar: avatar,
		addresses: addresses
	} as PersonData;
}
