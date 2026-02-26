
export function isValidUrl(url: string) {
	try {
		if (url != null) {
			new URL(url);
			// const http = new XMLHttpRequest();
			// http.open('HEAD', url, true);
			// http.send();
			// return http.status != 404;
			return true;
		} else
			return false;
	} catch (error) {
		return false;
	}
}

export async function IsArrayRow(value: string): Promise<boolean> {
	if (value == "") return false;
	const arrayValue: string[] = value.split(":")
	return (arrayValue.length > 1);
}
