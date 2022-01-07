import {ConversationItem} from "shared/data/blocks";

const localMessageCache = new Map<number, ConversationItem[]>();
export default localMessageCache;