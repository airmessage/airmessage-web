import React, {useEffect, useState} from "react";
import styles from "../item/Message.module.css";
import stylesImage from "./MessageAttachmentImage.module.css";

import {Backdrop, ButtonBase, createMuiTheme, IconButton, Toolbar, Tooltip, Typography} from "@material-ui/core";
import {ThemeProvider} from "@material-ui/core/styles";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import SaveAltIcon from "@material-ui/icons/SaveAlt";
import {downloadURL} from "../../../../util/browserUtils";
import {DecorativeMessageBubble, MessagePartProps} from "../item/Message";
import {StickerItem, TapbackItem} from "../../../../data/blocks";

export default function MessageAttachmentImage(props: {data: ArrayBuffer | Blob, name: string, type: string, partProps: MessagePartProps, tapbacks?: TapbackItem[], stickers?: StickerItem[]}) {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	const [previewOpen, setPreviewOpen] = useState(false);
	
	const theme = createMuiTheme({
		palette: {
			type: "dark",
			messageIncoming: undefined,
			messageOutgoing: undefined,
			messageOutgoingTextMessage: undefined
		}
	});
	
	useEffect(() => {
		//Cleaning up the current image URL
		if(imageURL) URL.revokeObjectURL(imageURL);
		
		//Creating a new image URL
		setImageURL(URL.createObjectURL(props.data instanceof Blob ? props.data : new Blob([props.data], {type: props.type})));
		
		return () => {
			if(imageURL) URL.revokeObjectURL(imageURL);
		};
	}, [props.data]);
	
	function downloadFile(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
		//So that we don't dismiss the backdrop
		event.stopPropagation();
		
		if(!imageURL) return;
		downloadURL(imageURL, props.type, props.name);
	}
	
	//All of the styles, without the border radius
	const buttonStyle: Partial<MessagePartProps> = {...props.partProps};
	delete buttonStyle["borderRadius"];
	
	return (
		<React.Fragment>
			<ThemeProvider theme={theme}>
				<Backdrop className={stylesImage.lightboxBackdrop} open={previewOpen} onClick={() => setPreviewOpen(false)}>
					<Toolbar className={stylesImage.lightboxToolbar}>
						<IconButton edge="start">
							<ArrowBackIcon />
						</IconButton>
						<Typography variant="h6" color="textPrimary" style={{flexGrow: 1}}>{props.name}</Typography>
						<Tooltip title="Save">
							<IconButton onClick={downloadFile}>
								<SaveAltIcon />
							</IconButton>
						</Tooltip>
					</Toolbar>
					<div className={stylesImage.lightboxContainer}>
						<div style={{width: "100%", height: "100%", backgroundImage: `url("${imageURL}")`, backgroundPosition: "center", backgroundRepeat: "no-repeat", backgroundSize: "contain"}} />
					</div>
				</Backdrop>
			</ThemeProvider>
			
			<DecorativeMessageBubble element={ButtonBase} className={styles.contentBubble} style={props.partProps} onClick={() => setPreviewOpen(true)} tapbacks={props.tapbacks} stickers={props.stickers}>
				<img src={imageURL} style={{borderRadius: props.partProps.borderRadius}} alt="" />
			</DecorativeMessageBubble>
			
			{/*<ButtonBase className={styles.contentBubble} style={props.partProps} onClick={() => setPreviewOpen(true)}>*/}
			{/*	<img src={imageURL} style={{borderRadius: props.partProps.borderRadius}} alt="" />*/}
			{/*</ButtonBase>*/}
		</React.Fragment>
	);
}