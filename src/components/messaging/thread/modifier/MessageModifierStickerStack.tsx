import React, {useEffect, useState} from "react";
import styles from "./MessageModifierStickerStack.module.css";
import {StickerItem} from "../../../../data/blocks";

export default function MessageModifierStickerStack(props: {modifiers: StickerItem[], reveal?: boolean}) {
	return (
		<div className={styles.container + (props.reveal ? " " + styles.transparent : "")}>
			{props.modifiers.map((sticker, index) => <MessageModifierSticker key={index} sticker={sticker} />)}
		</div>
	);
}

function MessageModifierSticker(props: {sticker: StickerItem, reveal?: boolean}) {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		//Cleaning up the current image URL
		if(imageURL) URL.revokeObjectURL(imageURL);
		
		//Creating a new image URL
		setImageURL(URL.createObjectURL(new Blob([props.sticker.data], {type: props.sticker.dataType})));
		
		return () => {
			if(imageURL) URL.revokeObjectURL(imageURL);
		};
	}, [props.sticker]);
	
	return (
		<img className={styles.sticker} src={imageURL} alt="" />
	);
}