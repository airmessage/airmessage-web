// Defines constants for all websocket close event codes that are used in practice
// Link: https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent

/**
 * Normal closure; the connection successfully completed whatever purpose for which it was created.
 */
export const NORMAL_CLOSURE = 1000;

/**
 * The endpoint is going away, either because of a server failure
 * or because the browser is navigating away from the page that opened the connection.
 */
export const GOING_AWAY = 1001;

/**
 * The endpoint is terminating the connection due to a protocol error.
 */
export const PROTOCOL_ERROR = 1002;

/**
 * The connection is being terminated because the endpoint received
 * data of a type it cannot accept (for example, a text-only endpoint received binary data).
 */
export const UNSUPPORTED_DATA = 1003;

/**
 * Reserved.
 * Indicates that no status code was provided even though one was expected.
 */
export const NO_STATUS_RECEIVED = 1005;

/**
 * Reserved.
 * Used to indicate that a connection was closed abnormally
 * (that is, with no close frame being sent) when a status code is expected.
 */
export const ABNORMAL_CLOSURE = 1006;

/**
 * The endpoint is terminating the connection because a message was received
 * that contained inconsistent data (e.g., non-UTF-8 data within a text message).
 */
export const INVALID_FRAME_PAYLOAD = 1007;

/**
 * The endpoint is terminating the connection because it received a message that
 * violates its policy. This is a generic status code, used when codes 1003 and 1009
 * are not suitable.
 */
export const POLICY_VIOLATION = 1008;

/**
 * The endpoint is terminating the connection because a data frame was
 * received that is too large.
 */
export const MESSAGE_TOO_BIG = 1009;

/**
 * The client is terminating the connection because it expected
 * the server to negotiate one or more extension, but the server didn't.
 */
export const MISSING_EXTENSION = 1010;

/**
 * The server is terminating the connection because it encountered an unexpected
 * condition that prevented it from fulfilling the request.
 */
export const INTERNAL_SERVER_ERROR = 1011;

/**
 * The server is terminating the connection because it is restarting.
 */
export const SERVICE_RESTART = 1012;

/**
 * The server is terminating the connection due to a temporary condition,
 * e.g. it is overloaded and is casting off some of its clients.
 */
export const TRY_AGAIN_LATER = 1013;

/**
 * The server was acting as a gateway or proxy and received an invalid response
 * from the upstream server. This is similar to 502 HTTP Status Code.
 */
export const BAD_GATEWAY = 1014;

/**
 * Reserved. Indicates that the connection was closed due to a failure to
 * perform a TLS handshake (e.g., the server certificate can't be verified).
 */
export const BAD_TLS_HANDSHAKE = 1015;
