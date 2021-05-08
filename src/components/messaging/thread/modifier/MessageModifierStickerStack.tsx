import React from "react";
import styles from "./MessageModifierStickerStack.module.css";
import {StickerItem} from "../../../../data/blocks";
import {useBlobURL} from "shared/util/hookUtils";

export default function MessageModifierStickerStack(props: {modifiers: StickerItem[], reveal?: boolean}) {
	return (
		<div className={styles.container + (props.reveal ? " " + styles.transparent : "")}>
			{props.modifiers.map((sticker, index) => <MessageModifierSticker key={index} sticker={sticker} />)}
		</div>
	);
}

function MessageModifierSticker(props: {sticker: StickerItem, reveal?: boolean}) {
	const imageURL = useBlobURL(props.sticker.data, props.sticker.dataType);
	
	return (
		<img className={styles.sticker} src={imageURL} alt="" />
	);
}