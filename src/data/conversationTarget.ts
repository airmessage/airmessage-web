type ConversationTarget =
  | { type: "linked"; guid: string }
  | { type: "unlinked"; members: string[]; service: string };

export default ConversationTarget;
