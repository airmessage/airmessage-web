import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as ConnectionManager from "../../../connection/connectionManager";
import { DetailFrame } from "../master/DetailFrame";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Fade,
  InputBase,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import {
  AddressData,
  AddressType,
  getPeople,
  PersonData,
} from "shared/interface/people/peopleUtils";
import {
  ConversationPreviewType,
  CreateChatErrorCode,
} from "shared/data/stateCodes";
import { Conversation } from "shared/data/blocks";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { SnackbarContext } from "../../control/SnackbarProvider";
import { generateConversationLocalID } from "shared/util/conversationUtils";
import WidthContainer from "shared/components/WidthContainer";
import DetailCreateSelectionChip from "shared/components/messaging/create/DetailCreateSelectionChip";
import NewMessageUser from "shared/data/newMessageUser";
import DetailCreateAddressButton from "shared/components/messaging/create/DetailCreateAddressButton";
import DetailCreateListSubheader from "shared/components/messaging/create/DetailCreateListSubheader";
import DetailCreateDirectSendButton from "shared/components/messaging/create/DetailCreateDirectSendButton";
import { groupArray } from "shared/util/arrayUtils";

const messagingService = "iMessage";

const regexEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const ScrimStack = styled(Stack)(({ theme }) => ({
  zIndex: theme.zIndex.modal,
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor:
    theme.palette.mode === "light"
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(0, 0, 0, 0.7)",
}));

export default function DetailCreate(props: {
  onConversationCreated: (conversation: Conversation) => void;
}) {
  const [query, setQuery] = useState<string>("");
  const [peopleSelection, setPeopleSelection] = useState<NewMessageUser[]>([]);
  const [peoplePool, setPeoplePool] = useState<PersonData[]>();
  const [isLoading, setLoading] = useState(false);

  const displaySnackbar = useContext(SnackbarContext);

  useEffect(() => {
    //Loading the people
    getPeople().then(setPeoplePool);
  }, [setPeoplePool]);

  const groupedPeople = useMemo(() => {
    //Return undefined if there are no people
    if (peoplePool === undefined) return undefined;

    const filter = query?.trim();

    let filteredPeople: PersonData[];

    //If there is no query to use, just put everyone in
    if (filter === undefined || filter.length === 0) {
      //Just put everyone in
      filteredPeople = peoplePool;
    } else {
      filteredPeople = [];
      const filterLower = filter.toLowerCase();
      const filterDigits = filter.replace(/\D/g, "");
      for (const person of peoplePool) {
        //Add people by name
        if (
          person.name !== undefined &&
          person.name.toLowerCase().includes(filterLower)
        ) {
          filteredPeople.push(person);
          continue;
        }

        if (filterLower.length > 0) {
          //Add people by address
          const matchedAddresses = person.addresses.filter((address) => {
            if (address.type === AddressType.Email) {
              //Basic filter email addresses
              return address.value.toLowerCase().includes(filterLower);
            } else if (
              address.type === AddressType.Phone &&
              filterDigits.length > 0
            ) {
              return address.value.toLowerCase().includes(filterDigits);
            } else {
              return false;
            }
          });

          if (matchedAddresses.length > 0) {
            //Adding the person with only the matched addresses
            filteredPeople.push({
              ...person,
              addresses: matchedAddresses,
            });
          }
        }
      }
    }

    //Group the people
    return groupArray(filteredPeople, (person) =>
      person.name?.charAt(0).toUpperCase()
    );
  }, [peoplePool, query]);

  //Finds a person's information based on their contact address
  const findPersonInfo = useCallback(
    (address: string): [PersonData, AddressData] | undefined => {
      if (peoplePool === undefined) {
        return undefined;
      }

      for (const person of peoplePool) {
        for (const personAddress of person.addresses) {
          if (personAddress.value === address) {
            return [person, personAddress];
          }
        }
      }

      return undefined;
    },
    [peoplePool]
  );

  //Attempts to add a user directly from the query input
  const handleDirectEntry = useCallback(() => {
    const address = query;

    //Checking if the item is an email address
    if (address.match(regexEmail)) {
      //Clearing the query text
      setQuery("");

      //Returning if the addition will conflict with any existing entries
      if (peopleSelection.find((selection) => selection.address === address))
        return;

      //Searching for the user in the listings
      const [personData, addressData] = findPersonInfo(query) ?? [
        undefined,
        undefined,
      ];

      //Adding the item
      setPeopleSelection(
        peopleSelection.concat({
          name: personData?.name,
          avatar: personData?.avatar,
          address: address,
          displayAddress: address,
          addressLabel: addressData?.label,
        })
      );
    } else {
      //Checking if the item is a phone number
      const phone = parsePhoneNumberFromString(query, "US");
      if (phone !== undefined && phone.isValid()) {
        //Clearing the query text
        setQuery("");

        //Format the phone number
        const formatted = phone.number.toString();

        //Returning if the addition will conflict with any existing entries
        if (
          peopleSelection.find((selection) => selection.address === formatted)
        )
          return;

        //Searching for the user in the listings
        const [personData, addressData] = findPersonInfo(formatted) ?? [
          undefined,
          undefined,
        ];

        //Adding the item
        setPeopleSelection(
          peopleSelection.concat({
            name: personData?.name,
            avatar: personData?.avatar,
            address: formatted,
            displayAddress: phone.formatNational(),
            addressLabel: addressData?.label,
          })
        );
      }
    }
  }, [query, peopleSelection, findPersonInfo, setQuery, setPeopleSelection]);

  //Updates the query text in response to a text change event
  const handleTextChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setQuery(event.target.value);
    },
    [setQuery]
  );

  //Deletes or submits users in the input box in response to a keyboard event
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Backspace") {
        //Removing the last person
        if (query.length === 0 && peopleSelection.length > 0) {
          setPeopleSelection(
            peopleSelection.slice(0, peopleSelection.length - 1)
          );
          event.preventDefault();
        }
      } else if (event.key === "Enter") {
        //Manually entering the query
        handleDirectEntry();
      }
    },
    [query, peopleSelection, setPeopleSelection, handleDirectEntry]
  );

  //Toggles the selection of an address
  const handleAddressClick = useCallback(
    (person: PersonData, address: AddressData) => {
      //Clearing the query text
      setQuery("");

      //Toggling the item
      setPeopleSelection((peopleSelection) => {
        const index = peopleSelection.findIndex(
          (selection) => selection.address === address.value
        );
        if (index !== -1) {
          //Remove the person
          return [
            ...peopleSelection.slice(0, index),
            ...peopleSelection.slice(index + 1),
          ];
        }

        //Add the person
        return peopleSelection.concat({
          name: person.name,
          avatar: person.avatar,
          address: address.value,
          displayAddress: address.displayValue,
          addressLabel: address.label,
        });
      });
    },
    [setQuery, setPeopleSelection]
  );

  //Removes a selection from the list
  const removeSelection = useCallback(
    (selection: NewMessageUser) => {
      setPeopleSelection((peopleSelection) =>
        peopleSelection.filter((value) => value !== selection)
      );
    },
    [setPeopleSelection]
  );

  const onConversationCreated = props.onConversationCreated;

  //Submits the selected people list and creates a new conversation
  const confirmParticipants = useCallback(() => {
    //Starting the loading view
    setLoading(true);

    //Mapping the people selection to their addresses
    const chatMembers = peopleSelection.map((selection) => selection.address);
    ConnectionManager.createChat(chatMembers, messagingService)
      .then((chatGUID) => {
        //Adding the chat
        onConversationCreated({
          localID: generateConversationLocalID(),
          guid: chatGUID,
          service: messagingService,
          members: chatMembers,
          preview: {
            type: ConversationPreviewType.ChatCreation,
            date: new Date(),
          },
          localOnly: false,
          unreadMessages: false,
        });
      })
      .catch(
        ([errorCode, errorDesc]: [CreateChatErrorCode, string | undefined]) => {
          if (errorCode === CreateChatErrorCode.NotSupported) {
            //If the server doesn't support creating chats,
            //create this chat locally and defer its creation
            //until the user sends a message
            onConversationCreated({
              localID: generateConversationLocalID(),
              service: messagingService,
              members: chatMembers,
              preview: {
                type: ConversationPreviewType.ChatCreation,
                date: new Date(),
              },
              localOnly: true,
              unreadMessages: false,
            });

            return;
          }

          //Cancelling loading
          setLoading(false);

          //Displaying a snackbar
          displaySnackbar({ message: "Failed to create conversation" });

          //Logging the error
          console.warn(`Failed to create chat: ${errorCode} / ${errorDesc}`);
        }
      );
  }, [displaySnackbar, peopleSelection, onConversationCreated, setLoading]);

  const [
    //Is the current input query a valid address that can be added directly?
    isQueryValidAddress,
    //A nicely-formatted version of the user's input
    formattedQuery,
  ] = useMemo((): [boolean, string] => {
    //Checking email address
    if (query.match(regexEmail)) {
      return [true, query];
    } else {
      //Checking phone number
      const phone = parsePhoneNumberFromString(query, "US");
      if (phone !== undefined && phone.isValid()) {
        return [true, phone.formatNational()];
      } else {
        return [false, query];
      }
    }
  }, [query]);

  return (
    <DetailFrame title="New conversation">
      <WidthContainer>
        <Stack height="100%" position="relative">
          {/* Loading scrim */}
          <Fade in={isLoading}>
            <ScrimStack alignItems="center" justifyContent="center">
              <CircularProgress />
            </ScrimStack>
          </Fade>

          {/* Input field */}
          <Stack
            sx={{
              backgroundColor: "messageIncoming.main",
              borderRadius: 1,
              marginY: 2,
            }}
            direction="row"
            alignItems="start"
          >
            <Stack
              padding={1}
              flexGrow={1}
              direction="row"
              alignItems="start"
              flexWrap="wrap"
              gap={1}
            >
              {peopleSelection.map((selection) => (
                <DetailCreateSelectionChip
                  key={selection.address}
                  selection={selection}
                  allSelections={peopleSelection}
                  onRemove={() => removeSelection(selection)}
                />
              ))}

              <InputBase
                sx={{ flexGrow: 1, marginLeft: 0.5 }}
                placeholder={
                  peopleSelection.length > 0
                    ? undefined
                    : "Type a name, email address, or phone number"
                }
                value={query}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                autoFocus
              />
            </Stack>

            <Button
              sx={{ flexShrink: 0, margin: "5.5px" }}
              variant="contained"
              color="primary"
              disabled={peopleSelection.length === 0}
              disableElevation
              onClick={confirmParticipants}
            >
              Done
            </Button>
          </Stack>

          {/* People list */}
          {groupedPeople === undefined ? (
            <Stack alignItems="center" justifyContent="center">
              <CircularProgress />
            </Stack>
          ) : (
            <Box
              sx={{
                width: "100%",
                overflowY: "scroll",
                paddingBottom: 2,
              }}
            >
              {isQueryValidAddress && (
                <DetailCreateDirectSendButton
                  address={formattedQuery}
                  onClick={handleDirectEntry}
                />
              )}

              {Array.from(groupedPeople.entries()).map(
                ([firstLetter, people]) => (
                  <React.Fragment key={firstLetter}>
                    <DetailCreateListSubheader>
                      {firstLetter ?? "?"}
                    </DetailCreateListSubheader>

                    {people.map((person) => (
                      <Stack key={person.id} direction="row" marginTop={2}>
                        <Avatar src={person.avatar} alt={person.name} />

                        <Box sx={{ paddingX: 2 }}>
                          <Typography variant="body1" color="textPrimary">
                            {person.name}
                          </Typography>

                          <Stack
                            direction="row"
                            alignItems="start"
                            flexWrap="wrap"
                            columnGap={2}
                          >
                            {person.addresses.map((address) => (
                              <DetailCreateAddressButton
                                key={address.value + "/" + address.label}
                                address={address}
                                selected={peopleSelection.some(
                                  (selection) =>
                                    selection.address === address.value
                                )}
                                onClick={() =>
                                  handleAddressClick(person, address)
                                }
                              />
                            ))}
                          </Stack>
                        </Box>
                      </Stack>
                    ))}
                  </React.Fragment>
                )
              )}
            </Box>
          )}
        </Stack>
      </WidthContainer>
    </DetailFrame>
  );
}
