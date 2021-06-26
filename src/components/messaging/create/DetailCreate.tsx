import React, {useContext, useEffect, useState} from "react";
import styles from "./DetailCreate.module.css";

import * as ConnectionManager from "../../../connection/connectionManager";
import {DetailFrame} from "../master/DetailFrame";
import {
	Avatar,
	Button,
	ButtonBase,
	Chip,
	CircularProgress, fade,
	InputBase, Theme,
	Tooltip,
	Typography,
	useTheme
} from "@material-ui/core";
import {AddressData, AddressType, getPeople, PersonData} from "../../../util/peopleUtils";
import ChatBubbleOutlineIcon from "@material-ui/icons/ChatBubbleOutline";
import MessageCheckIcon from "../../icon/MessageCheckIcon";
import {ConversationPreviewType, CreateChatErrorCode} from "../../../data/stateCodes";
import {Conversation} from "../../../data/blocks";
import {parsePhoneNumberFromString} from "libphonenumber-js";
import {makeStyles} from "@material-ui/core/styles";
import {SnackbarContext} from "../../control/SnackbarProvider";

const messagingService = "iMessage";

const regexEmail = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export default function DetailCreate(props: {onConversationCreated: (conversation: Conversation) => void}) {
	const [query, setQuery] = useState<string>("");
	const [peopleSelection, setPeopleSelection] = useState<SelectionData[]>([]);
	const [peoplePool, setPeoplePool] = useState<PersonData[]>();
	const [isLoading, setLoading] = useState(false);
	
	const displaySnackbar = useContext(SnackbarContext);
	
	const theme = useTheme();
	
	useEffect(() => {
		//Loading the people
		getPeople().then((people) => {
			setPeoplePool(people);
		});
	}, []);
	
	const groupedPeople = peoplePool ? filterAndGroup(peoplePool, query) : undefined;
	
	function handleTextChange(event: React.ChangeEvent<HTMLInputElement>) {
		const text = event.target.value;
		
		//Updating the query text
		setQuery(text);
	}
	
	function handleKeyDown(event: React.KeyboardEvent<any>) {
		if(event.key === "Backspace") {
			//Removing the last person
			if(query.length === 0 && peopleSelection.length > 0) {
				setPeopleSelection(peopleSelection.slice(0, peopleSelection.length - 1));
				event.preventDefault();
			}
		} else if(event.key === "Enter") {
			//Manually entering the query
			handleDirectEntry();
		}
	}
	
	function handleAddressClick(person: PersonData, address: AddressData) {
		//Clearing the query text
		setQuery("");
		
		//Toggling the item
		const index = peopleSelection.findIndex((selection) => selection.address === address.value);
		if(index === -1) {
			setPeopleSelection(peopleSelection.concat({
				name: person.name,
				avatar: person.avatar,
				address: address.value,
				displayAddress: address.displayValue,
				addressLabel: address.label
			}));
		} else {
			setPeopleSelection([...peopleSelection.slice(0, index), ...peopleSelection.slice(index + 1)]);
		}
	}
	
	function findPersonInfo(address: string): [PersonData, AddressData] | undefined {
		if(!peoplePool) return undefined;
		
		for(const person of peoplePool) {
			for(const personAddress of person.addresses) {
				if(personAddress.value === address) {
					return [person, personAddress];
				}
			}
		}
		
		return undefined;
	}
	
	function handleDirectEntry() {
		const address = query;
		
		//Checking if the item is an email address
		if(address.match(regexEmail)) {
			//Clearing the query text
			setQuery("");
			
			//Returning if the addition will conflict with any existing entries
			if(peopleSelection.find((selection) => selection.address === address)) return;
			
			//Searching for the user in the listings
			const [personData, addressData] = findPersonInfo(query) ?? [undefined, undefined];
			
			//Adding the item
			setPeopleSelection(peopleSelection.concat({
				name: personData?.name,
				avatar: personData?.avatar,
				address: address,
				displayAddress: address,
				addressLabel: addressData?.label
			}));
		} else {
			//Checking if the item is a phone number
			const phone = parsePhoneNumberFromString(query, "US");
			const formatted = phone?.number.toString();
			if(phone && phone.isValid()) {
				//Clearing the query text
				setQuery("");
				
				//Returning if the addition will conflict with any existing entries
				if(peopleSelection.find((selection) => selection.address === formatted!)) return;
				
				//Searching for the user in the listings
				const [personData, addressData] = findPersonInfo(formatted!) ?? [undefined, undefined];
				
				//Adding the item
				setPeopleSelection(peopleSelection.concat({
					name: personData?.name,
					avatar: personData?.avatar,
					address: formatted!,
					displayAddress: phone.formatNational(),
					addressLabel: addressData?.label
				}));
			}
		}
	}
	
	function handleRemoveSelection(selection: SelectionData) {
		setPeopleSelection(peopleSelection.filter((value) => value !== selection));
	}
	
	function confirmParticipants() {
		//Starting the loading view
		setLoading(true);
		
		//Mapping the people selection to their addresses
		const chatMembers = peopleSelection.map((selection) => selection.address);
		ConnectionManager.createChat(chatMembers, messagingService)
			.then((chatGUID) => {
				//Adding the chat
				props.onConversationCreated({
					guid: chatGUID,
					service: messagingService,
					members: chatMembers,
					preview: {
						type: ConversationPreviewType.ChatCreation,
						date: new Date()
					}
				});
			}).catch((reason: [CreateChatErrorCode, string | undefined]) => {
				//Cancelling loading
				setLoading(false);
				
				//Displaying a snackbar
				displaySnackbar({message: "Failed to create conversation"});
			});
	}
	
	let queryDirectState: boolean; //Is the current input query a valid address that can be added directly?
	let queryDirectDisplay: string;
	{
		//Checking email address
		if(query.match(regexEmail)) {
			queryDirectState = true;
			queryDirectDisplay = query;
		} else {
			//Checking phone number
			const phone = parsePhoneNumberFromString(query, "US");
			if(phone && phone.isValid()) {
				queryDirectState = true;
				queryDirectDisplay = phone.formatNational();
			} else {
				queryDirectState = false;
				queryDirectDisplay = query;
			}
		}
	}
	
	return (
		<DetailFrame title="New conversation">
			<div className={styles.content}>
				<div className={`${isLoading ? styles.scrimShown : styles.scrimHidden} ${styles.progressContainer}`} style={{backgroundColor: theme.palette.type === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)"}}>
					<CircularProgress />
				</div>
				
				<div className={styles.participantInputWrapper}>
					<div className={styles.participantInputLayout} style={{backgroundColor: theme.palette.messageIncoming.main}}>
						<div className={styles.participantInputFlow}>
							<SelectionList className={styles.participantInputChip} selections={peopleSelection} onRemove={handleRemoveSelection} />
							<InputBase className={styles.participantInputField} placeholder={peopleSelection.length > 0 ? undefined : "Type a name, email address, or phone number"} value={query} onChange={handleTextChange} onKeyDown={handleKeyDown} autoFocus />
						</div>
						<Button className={styles.participantInputButton} variant="contained" color="primary" disabled={peopleSelection.length === 0} disableElevation onClick={confirmParticipants}>Done</Button>
					</div>
				</div>
				
				{
					groupedPeople ? <div className={styles.listWrapper}>
						<div className={styles.list}>
							{queryDirectState && <DirectSendButton address={queryDirectDisplay} onClick={handleDirectEntry} />}
							{Object.entries(groupedPeople).map(([firstLetter, people]) => (
								<React.Fragment key={`section-${firstLetter}`}>
									<ListSubheader>{firstLetter}</ListSubheader>
									{people.map((person) => (
										<div key={person.id} className={styles.contactRoot}>
											<Avatar src={person.avatar} alt={person.name} />
											<div className={styles.contactText}>
												<Typography variant="body1" color="textPrimary">{person.name}</Typography>
												<div className={styles.contactAddresses}>
													{person.addresses.map((address) => (
														<AddressButton key={address.value + "/" + address.label} address={address} selected={peopleSelection.find((selection) => selection.address === address.value) !== undefined} onClick={() => handleAddressClick(person, address)} />
													))}
												</div>
											</div>
										</div>
									))}
								</React.Fragment>
							))}
						</div>
					</div> : <div className={`${styles.listWrapper} ${styles.progressContainer}`}>
						<CircularProgress />
					</div>
				}
			</div>
		</DetailFrame>
	);
}

function filterAndGroup(data: PersonData[], filter?: string): {[x: string]: PersonData[]} {
	let people: PersonData[];
	
	//Checking if there is no filter to use
	if(!filter || (filter = filter.trim()).length === 0) {
		//Just put everyone in
		people = data;
	} else {
		people = [];
		const filterLower = filter.toLowerCase();
		const filterDigits = filter.replace(/\D/g,"");
		for(const person of data) {
			//Add people by name
			if(person.name && person.name.toLowerCase().includes(filterLower)) {
				people.push(person);
				continue;
			}
			
			if(filterLower.length > 0) {
				//Add people by address
				const matchedAddresses = person.addresses.filter((address) => {
					if(address.type === AddressType.Email) {
						//Basic filter email addresses
						return address.value.toLowerCase().includes(filterLower);
					} else if(address.type === AddressType.Phone && filterDigits.length > 0) {
						return address.value.toLowerCase().includes(filterDigits);
					} else {
						return false;
					}
				});
				
				if(matchedAddresses.length > 0) {
					//Adding the person with only the matched addresses
					people.push({
						...person,
						addresses: matchedAddresses
					});
					
					continue;
				}
			}
		}
	}
	
	return people.reduce((accumulator: {[index: string]: PersonData[]}, item: PersonData) => {
		//Skip entries with no name
		if(item.name) {
			//Collect entries that start with the same letter
			const firstLetter = item.name.charAt(0).toUpperCase();
			if(!accumulator[firstLetter]) accumulator[firstLetter] = [];
			accumulator[firstLetter].push(item);
		}
		
		return accumulator;
	}, {});
}

function ListSubheader(props: {children: React.ReactNode}) {
	return (
		<Typography variant="body2" color="textSecondary" className={styles.subheaderText}>{props.children}</Typography>
	);
}

function AddressButton(props: {address: AddressData, selected: boolean, onClick: () => void}) {
	let display = props.address.displayValue;
	if(props.address.label) display += ` (${props.address.label})`;
	
	function onMouseDown(event: React.MouseEvent<HTMLElement>) {
		event.preventDefault();
	}
	
	return <Button
		className={styles.contactButton + (props.selected ? "" : " " + styles.buttonUnselected)}
		startIcon={props.selected ? <MessageCheckIcon /> : <ChatBubbleOutlineIcon />}
		size="small"
		color={props.selected ? "primary" : "default"}
		onClick={props.onClick}
		onMouseDown={onMouseDown}>
		{display}
	</Button>;
}

function SelectionList(props: {className?: string, selections: SelectionData[], onRemove: (selection: SelectionData) => void}) {
	return (
		<React.Fragment>
			{props.selections.map((selection) => {
				let label: string;
				let tooltip: string | undefined;
				if(selection.name) {
					//Checking for a duplicate name
					if(selection.addressLabel) {
						if(props.selections.find((allSelections) => selection !== allSelections && selection.name === allSelections.name)) {
							label = `${selection.name} (${selection.addressLabel})`;
							tooltip = selection.displayAddress;
						} else {
							label = selection.name;
							tooltip = `${selection.displayAddress} (${selection.addressLabel})`;
						}
					} else {
						label = selection.name;
						tooltip = selection.displayAddress;
					}
				} else {
					label = selection.displayAddress;
					
					//Display the address label in the tooltip if available
					if(selection.addressLabel) tooltip = `${selection.displayAddress} (${selection.addressLabel})`;
					else tooltip = undefined;
				}
				
				return <SelectionChip key={selection.address} className={props.className} selection={selection} label={label} tooltip={tooltip} onDelete={() => props.onRemove(selection)} />;
			})}
		</React.Fragment>
	);
}

function SelectionChip(props: {selection: SelectionData, label: string, tooltip?: string, onDelete: () => void, className?: string}) {
	const chip = <Chip className={props.className} label={props.label} avatar={<Avatar src={props.selection.avatar} alt={props.selection.name} />} onDelete={props.onDelete} />;
	return !props.tooltip ? chip : <Tooltip title={props.tooltip}>{chip}</Tooltip>;
}

interface SelectionData {
	name?: string;
	avatar?: string;
	address: string;
	displayAddress: string;
	addressLabel?: string;
}

export const useDirectSendButtonStyles = makeStyles((theme: Theme) => ({
	/* Styles applied to the root element. */
	root: {
		width: "100%",
		padding: "8px 0",
		transition: theme.transitions.create(["background-color", "box-shadow", "border"], {
			duration: theme.transitions.duration.short,
		}),
		borderRadius: theme.shape.borderRadius,
		display: "flex",
		flexDirection: "row",
		justifyContent: "flex-start",
		"&:hover": {
			backgroundColor: fade(theme.palette.text.primary, theme.palette.action.hoverOpacity),
		}
	},
	avatar: {
		backgroundColor: theme.palette.primary.main,
		marginRight: "16px !important"
	}
}));

function DirectSendButton(props: {address: string, onClick: () => void}) {
	const classes = useDirectSendButtonStyles();
	
	return (
		<ButtonBase className={classes.root} onClick={props.onClick}>
			<Avatar className={classes.avatar} />
			<Typography>Send to <b>{props.address}</b></Typography>
		</ButtonBase>
	);
}