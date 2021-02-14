export function setCookie(name: string, value: string) {
	document.cookie = `${name}=${value};samesite=strict`;
}

export function hasCookie(name: string): boolean {
	return document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + "=([^;]*)"
	)) != null;
}


export function getCookie(name: string): string | undefined {
	return document.cookie
		.split('; ')
		.find(row => row.startsWith(name + "="))
		?.split('=')[1];
}