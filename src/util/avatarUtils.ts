const colors = [
	"#FF1744", //Red
	"#F50057", //Pink
	"#B317CF", //Purple
	"#703BE3", //Dark purple
	"#3D5AFE", //Indigo
	"#2979FF", //Blue
	"#00B0FF", //Light blue
	"#00B8D4", //Cyan
	"#00BFA5", //Teal
	"#00C853", //Green
	"#5DD016", //Light green
	"#99CC00", //Lime green
	"#F2CC0D", //Yellow
	"#FFC400", //Amber
	"#FF9100", //Orange
	"#FF3D00", //Deep orange
];

export function colorFromContact(contact: string): string {
	return colors[Math.abs(hashString(contact)) % colors.length];
}

//https://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function hashString(input: string): number {
	let hash = 0, i, chr;
	for(i = 0; i < input.length; i++) {
		chr = input.charCodeAt(i);
		hash = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
}