type CallEvent =
  | {
      type: "outgoingAccepted";
      faceTimeLink: string;
    }
  | {
      type: "outgoingRejected";
    }
  | {
      type: "outgoingError";
      errorDetails: string | undefined;
    }
  | {
      type: "incomingHandled";
      faceTimeLink: string;
    }
  | {
      type: "incomingHandleError";
      errorDetails: string | undefined;
    };
export default CallEvent;
