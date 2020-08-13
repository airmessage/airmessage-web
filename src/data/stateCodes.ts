export enum ConversationItemType {
	Message,
	ParticipantAction,
	ChatRenameAction
}

export enum ConversationPreviewType {
	Message,
	ChatCreation
}

export enum MessageModifierType {
	StatusUpdate,
	Sticker,
	Tapback
}

export enum TapbackType {
	Love,
	Like,
	Dislike,
	Laugh,
	Emphasis,
	Question
}

export enum ConnectionErrorCode {
	//Standard error codes
	Connection,
	Internet,
	InternalError,
	ExternalError,
	
	//Shared proxy error codes
	BadRequest,
	ClientOutdated,
	ServerOutdated,
	
	//Connect proxy error codes
	ConnectNoGroup,
	ConnectNoCapacity,
	ConnectAccountValidation,
	ConnectNoSubscription,
	ConnectOtherLocation
}

export enum MessageStatusCode {
	Unconfirmed,
	Idle,
	Sent,
	Delivered,
	Read
}

export interface MessageError {
	code: MessageErrorCode;
	detail?: string;
}

export enum MessageErrorCode {
	//App-provided error codes
	//LocalUnknown, //Unknown error (for example, a version upgrade where error codes change)
	LocalInvalidContent, //Invalid content
	LocalTooLarge, //Attachment too large
	LocalIO, //IO exception
	LocalNetwork, //Network exception
	LocalInternalError, //Internal exception
	
	//Server-provided error codes
	ServerUnknown, //An unknown response code was received from the server
	ServerExternal, //The server received an external error
	ServerBadRequest, //The server couldn't process the request
	ServerUnauthorized, //The server doesn't have permission to send messages
	ServerTimeout, //The server timed out the client's request
	
	//Apple-provided error codes
	AppleNoConversation, //The server couldn't find the requested conversation
	AppleNetwork, //The server received a network error
	AppleUnregistered, //The addressee doesn't have an iMessage account
}

export enum ParticipantActionType {
	Unknown,
	Join,
	Leave
}

export enum AttachmentRequestErrorCode {
	Timeout, //Request timed out
	BadResponse, //Bad response (packets out of order)
	ServerUnknown, //Unknown error from the server
	ServerNotFound, //Server file GUID not found
	ServerNotSaved, //Server file (on disk) not found
	ServerUnreadable, //Server no access to file
	ServerIO //Server I/O error
}

export enum CreateChatErrorCode {
	Network, //Network / timeout error
	ScriptError, //Some unknown AppleScript error
	BadRequest, //Invalid data received
	Unauthorized, //System rejected request
	UnknownExternal //Unknown error code received
}