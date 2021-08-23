import {ConversationItem} from "shared/data/blocks";

/**
 * Compares 2 conversation items (sort for ascending order)
 */
export function sortConversationItems(item1: ConversationItem, item2: ConversationItem) {
	return item2.date.getTime() - item1.date.getTime();
}