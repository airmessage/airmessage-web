import {useEffect, useState} from "react";

export function useBlobURL(data: BlobPart, type?: string): string | undefined {
	const [imageURL, setImageURL] = useState<string | undefined>(undefined);
	
	useEffect(() => {
		//Generating an image URL
		const imageURL = URL.createObjectURL(new Blob([data], {type: type}));
		
		//Creating a new image URL
		setImageURL(imageURL);
		
		//Cleaning up image URL
		return () => URL.revokeObjectURL(imageURL);
	}, [data, type, setImageURL]);
	
	return imageURL;
}