import {
  AttachmentRequestErrorCode,
  ConnectionErrorCode,
  MessageErrorCode,
  RemoteUpdateErrorCode,
} from "shared/data/stateCodes";
import { connect as connectToServer } from "shared/connection/connectionManager";
import { getAuth, signOut } from "firebase/auth";
import {
  appleServiceAppleMessage,
  appleServiceTextMessageForwarding,
} from "shared/data/appleConstants";

export interface ErrorDisplay {
  message: string;
  button?: ButtonAction;
}

export interface ButtonAction {
  label: string;
  onClick: () => void;
}

const buttonActionRetry: ButtonAction = {
  label: "Retry",
  onClick: () => {
    connectToServer();
  },
};

/**
 * Maps a message error code to a human-readable string
 */
export function messageErrorToDisplay(error: MessageErrorCode): string {
  switch (error) {
    case MessageErrorCode.LocalInvalidContent:
      return "The selected content is unavailable";
    case MessageErrorCode.LocalTooLarge:
      return "The selected content is too large to send";
    case MessageErrorCode.LocalIO:
      return "Couldn't process selected content";
    case MessageErrorCode.LocalNetwork:
      return "Couldn't connect to AirMessage server";
    case MessageErrorCode.LocalInternalError:
      return "An internal error occurred";
    case MessageErrorCode.ServerUnknown:
      return "An unknown external error occurred";
    case MessageErrorCode.ServerExternal:
      return "An external error occurred";
    case MessageErrorCode.ServerBadRequest:
      return "An error occurred while sending this message";
    case MessageErrorCode.ServerUnauthorized:
      return "AirMessage server isn't allowed to send messages";
    case MessageErrorCode.ServerTimeout:
      return "This message couldn't be delivered properly";
    case MessageErrorCode.AppleNoConversation:
      return "This conversation isn't available";
    case MessageErrorCode.AppleNetwork:
      return "Couldn't connect to iMessage server";
    case MessageErrorCode.AppleUnregistered:
      return "This recipient is not registered with iMessage";
    default:
      return "An unknown error occurred";
  }
}

/**
 * Maps a connection error code to a human-readable description and optional action
 * @param error The error code to map
 * @param isDirect Whether the connection is made directly to the server without the use of a proxy
 */
export function errorCodeToShortDisplay(
  error: ConnectionErrorCode,
  isDirect?: boolean
): ErrorDisplay {
  switch (error) {
    case ConnectionErrorCode.Connection:
    case ConnectionErrorCode.Internet:
      return {
        message: isDirect ? "Server not reachable" : "No internet connection",
      };
    case ConnectionErrorCode.InternalError:
      return {
        message: "An internal error occurred",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.ExternalError:
      return {
        message: "An external error occurred",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.BadRequest:
      return {
        message: "A connection compatibility error occurred",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.ClientOutdated:
      return {
        message: "App is out-of-date",
        button: {
          label: "Refresh",
          onClick: () => {
            window.location.reload();
          },
        },
      };
    case ConnectionErrorCode.ServerOutdated:
      return {
        message: "Server is out-of-date",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.Unauthorized:
      return {
        message: "Password not accepted",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.ConnectNoGroup:
      return {
        message: "Personal server not reachable",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.ConnectNoCapacity:
      return {
        message: "Connected device limit reached",
        button: buttonActionRetry,
      };
    case ConnectionErrorCode.ConnectAccountValidation:
      return {
        message: "Account verification error",
        button: {
          label: "Sign out",
          onClick: () => {
            signOut(getAuth());
          },
        },
      };
    case ConnectionErrorCode.ConnectNoActivation:
      return {
        message: "Account not activated",
      };
    case ConnectionErrorCode.ConnectOtherLocation:
      return {
        message: "Server computer swapped",
        button: {
          label: "Refresh",
          onClick: () => {
            window.location.reload();
          },
        },
      };
  }
}

/**
 * Maps a remote update error code to a human-readable string
 */
export function remoteUpdateErrorCodeToDisplay(
  error: RemoteUpdateErrorCode
): string {
  switch (error) {
    case RemoteUpdateErrorCode.Unknown:
    default:
      return "An unknown error occurred";
    case RemoteUpdateErrorCode.Mismatch:
      return "This update is no longer applicable";
    case RemoteUpdateErrorCode.Download:
      return "An error occurred while downloading the update";
    case RemoteUpdateErrorCode.BadPackage:
      return "An error occurred while processing the update";
    case RemoteUpdateErrorCode.Internal:
      return "An internal error occurred";
    case RemoteUpdateErrorCode.Timeout:
      return "Request timed out";
  }
}

/**
 * Combines an array of strings to a human-readable list
 */
export function buildListString(parts: string[]): string {
  if (parts.length === 0) return "";
  else if (parts.length === 1) return parts[0];
  else if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  else
    return (
      parts.slice(0, parts.length - 1).join(", ") +
      ", and " +
      parts[parts.length - 1]
    );
}

/**
 * Maps an attachment request error code to a human-readable description
 */
export function attachmentRequestErrorCodeToDisplay(
  error: AttachmentRequestErrorCode
): string {
  switch (error) {
    case AttachmentRequestErrorCode.Timeout:
      return "Request timed out";
    case AttachmentRequestErrorCode.BadResponse:
      return "A communication error occurred";
    case AttachmentRequestErrorCode.ServerUnknown:
      return "An unknown external error occurred";
    case AttachmentRequestErrorCode.ServerNotFound:
      return "Message not found";
    case AttachmentRequestErrorCode.ServerNotSaved:
      return "Attachment file not found";
    case AttachmentRequestErrorCode.ServerUnreadable:
      return "No permission to read file";
    case AttachmentRequestErrorCode.ServerIO:
      return "Failed to read file";
  }
}

/**
 * Maps a service name to a human-readable string
 */
export function mapServiceName(service: string): string {
  switch (service) {
    case appleServiceAppleMessage:
      return "iMessage";
    case appleServiceTextMessageForwarding:
      return "Text message";
    default:
      return "Unknown";
  }
}

const sizeUnits = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
const bytesPerUnit = 1024;

/**
 * Gets a human-readable representation of a number of bytes
 * @param bytes The number of bytes to convert
 * @param decimals The maximum number of decimals to display
 */
//https://stackoverflow.com/a/18650828
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 bytes";

  const dm = Math.max(decimals, 0);

  const i = Math.floor(Math.log(bytes) / Math.log(bytesPerUnit));

  return (
    parseFloat((bytes / Math.pow(bytesPerUnit, i)).toFixed(dm)) +
    " " +
    sizeUnits[i]
  );
}
