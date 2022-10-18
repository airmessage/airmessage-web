import {
	DependencyList,
	Dispatch,
	SetStateAction,
	useContext,
	useDeferredValue,
	useEffect,
	useMemo,
	useRef,
	useState
} from "react";
import * as ConnectionManager from "shared/connection/connectionManager";
import {Conversation} from "shared/data/blocks";
import {getMemberTitleSync} from "./conversationUtils";
import UnsubscribeCallback from "shared/data/unsubscribeCallback";
import {PeopleContext} from "shared/state/peopleState";
import {PersonData} from "shared/interface/people/peopleUtils";

/**
 * Generates a blob URL for a {@link BlobPart}
 * @param data The blob data to generate a URL for
 * @param type The data type
 */
export function useBlobURL(data: BlobPart, type?: string): string | undefined {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		//Generating an image URL
		const imageURL = URL.createObjectURL(new Blob([data], {type: type}));
		
		//Creating a new image URL
		setImageURL(imageURL);
		
		//Cleaning up image URL
		return () => {
			URL.revokeObjectURL(imageURL);
			setImageURL(undefined);
		};
	}, [data, type, setImageURL]);
	
	return imageURL;
}

/**
 * Holds a state along with a cached value that is never null
 * @param initialState The initial non-nullable value
 * @return The nullable state value, the non-nullable cache value,
 * and a function to update the state
 */
export function useNonNullableCacheState<S>(
	initialState: NonNullable<S> | (() => (NonNullable<S>))
): [S, NonNullable<S>, Dispatch<SetStateAction<S>>];

/**
 * Holds a state along with a cached value that is never null
 * @param initialState The initial nullable value
 * @param initialCacheState The initial non-nullable cache value
 * @return The nullable state value, the non-nullable cache value,
 * and a function to update the state
 */
export function useNonNullableCacheState<S>(
	initialState: S | (() => (S)),
	initialCacheState: NonNullable<S> | (() => (NonNullable<S>))
): [S, NonNullable<S>, Dispatch<SetStateAction<S>>];

export function useNonNullableCacheState<S>(...args: [
		NonNullable<S> | (() => (NonNullable<S>))
] | [
		S | (() => (S)),
		NonNullable<S> | (() => (NonNullable<S>))
]): [S, NonNullable<S>, Dispatch<SetStateAction<S>>] {
	const initialState: S | (() => (S)) = args[0];
	let initialCacheState: NonNullable<S> | (() => (NonNullable<S>));
	if(args.length === 1) {
		initialCacheState = args[0];
	} else {
		initialCacheState = args[1];
	}
	
	//State value
	const [value, setValue] = useState<S>(initialState);
	
	//Cache value
	const [cacheValue, setCacheValue] = useState<NonNullable<S>>(initialCacheState);
	
	//Sync cache value to state value
	const deferredValue = useDeferredValue(value);
	useEffect(() => {
		if(deferredValue) {
			setCacheValue(deferredValue as NonNullable<S>);
		}
	}, [deferredValue, setCacheValue]);
	
	
	return [value, cacheValue, setValue];
}

/**
 * Wrapper for useEffect, that passes a function that can wrap a promise
 * whose result will be ignored if it resolves after the component unmounts
 */
export function useCancellableEffect(
	effect: (
		addPromise: <T>(promise: Promise<T>) => Promise<T>
	) => void | VoidFunction,
	deps?: DependencyList
) {
	useEffect(() => {
		let isCancelled = false;
		
		const cleanup = effect(<T>(promise: Promise<T>): Promise<T> => {
			return new Promise<T>((resolve, reject) => {
				promise
					.then((val) => !isCancelled && resolve(val))
					.catch((error) => !isCancelled && reject(error));
			});
		});
		
		return () => {
			isCancelled = true;
			cleanup?.();
		};
	}, deps); //eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Creates a container of {@link UnsubscribeCallback}, that invokes all its
 * unsubscribe callbacks and clears itself whenever its dependencies change
 *
 * @return A function that adds a new {@link UnsubscribeCallback} to the container
 */
export function useUnsubscribeContainer(deps?: DependencyList): (unsubscribe: UnsubscribeCallback) => void {
	const callbackCollection = useRef(new Set<UnsubscribeCallback>()).current;
	
	useEffect(() => {
		return () => {
			//Call all unsubscribers
			for(const unsubscribe of callbackCollection) {
				unsubscribe();
			}
			
			//Clear the collection
			callbackCollection.clear();
		};
	}, deps); //eslint-disable-line react-hooks/exhaustive-deps
	
	return (callback) => {
		callbackCollection.add(callback);
	};
}

/**
 * Keeps track of whether FaceTime is supported by the connected server
 */
export function useIsFaceTimeSupported(): boolean {
	const [isFaceTimeSupported, setIsFaceTimeSupported] = useState(false);
	useEffect(() => {
		ConnectionManager.faceTimeSupportedEmitter.subscribe(setIsFaceTimeSupported);
		return () => ConnectionManager.faceTimeSupportedEmitter.unsubscribe(setIsFaceTimeSupported);
	}, [setIsFaceTimeSupported]);
	
	return isFaceTimeSupported;
}

/**
 * Builds a title from a conversation
 */
export function useConversationTitle(conversation: Conversation): string {
	const peopleState = useContext(PeopleContext);
	return useMemo(() => {
		//If the conversation has a name, use that
		if(conversation.name !== undefined && conversation.name.length > 0) {
			return conversation.name;
		}
		
		return getMemberTitleSync(conversation.members, peopleState);
	}, [conversation, peopleState]);
}

/**
 * Gets the data of a person, or undefined
 * if none could be found
 */
export function usePersonData(address: string | undefined): PersonData | undefined {
	const peopleState = useContext(PeopleContext);
	
	return useMemo(() => {
		if(address === undefined) return undefined;
		return peopleState.getPerson(address);
	}, [address, peopleState]);
}

/**
 * Gets the display name of a person,
 * returning their address as fallback
 */
export function usePersonName(address: string): string;
export function usePersonName(address: undefined): undefined;
export function usePersonName(address: string | undefined): string | undefined;
export function usePersonName(address: string | undefined): string | undefined {
	const personData = usePersonData(address);
	return personData?.name ?? address;
	
	/* const peopleState = useContext(PeopleContext);
	return useMemo(() => {
		if(address === undefined) return undefined;
		return peopleState.getPerson(address)?.name ?? address;
	}, [address, peopleState]); */
}
