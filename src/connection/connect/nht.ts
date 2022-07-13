//AirMessage Connect communications version
export const commVer = 1;

//Shared het header types
/*
 * The connected device has been connected successfully
 */
export const nhtConnectionOK = 0;

//Client-only net header types

/*
 * Proxy the message to the server (client -> connect)
 *
 * payload - data
 */
export const nhtClientProxy = 100;

/*
 * Add an item to the list of FCM tokens (client -> connect)
 *
 * string - registration token
 */
export const nhtClientAddFCMToken = 110;

/*
 * Remove an item from the list of FCM tokens (client -> connect)
 *
 * string - registration token
 */
export const nhtClientRemoveFCMToken = 111;

//Server-only net header types

/*
 * Notify a new client connection (connect -> server)
 *
 * - connection ID
 */
export const nhtServerOpen = 200;

/*
 * Close a connected client (server -> connect)
 * Notify a closed connection (connect -> server)
 *
 * - connection ID
 */
export const nhtServerClose = 201;

/*
 * Proxy the message to the client (server -> connect)
 * Receive data from a connected client (connect -> server)
 *
 * - connection ID
 * payload - data
 */
export const nhtServerProxy = 210;

/*
 * Proxy the message to all connected clients (server -> connect)
 *
 * payload - data
 */
export const nhtServerProxyBroadcast = 211;

/**
 * Notify offline clients of a new message
 */
export const nhtServerNotifyPush = 212;

//Disconnection codes
export const closeCodeIncompatibleProtocol = 4000; //No protocol version matching the one requested
export const closeCodeNoGroup = 4001; //There is no active group with a matching ID
export const closeCodeNoCapacity = 4002; //The client's group is at capacity
export const closeCodeAccountValidation = 4003; //This account couldn't be validated
export const closeCodeServerTokenRefresh = 4004; //The server's provided installation ID is out of date; log in again to re-link this device
export const closeCodeNoActivation = 4005; //This user's account is not activated
export const closeCodeOtherLocation = 4006; //Logged in from another location
