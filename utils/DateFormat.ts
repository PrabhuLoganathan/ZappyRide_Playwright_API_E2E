
export function dateFormat(date: Date): string {
	const day = date.getDate().toString().padStart(2,'0');
	const month = (date.getMonth() + 1).toString().padStart(2,'0');
	const year = date.getFullYear();
	return `${day}_${month}_${year}`;
}

export function formatDateTime(date:Date): string {
	const fmtDate = dateFormat(date);
	const hrs = date.getHours().toString().padStart(2,'0');
	const min = date.getMinutes().toString().padStart(2,'0');
	const sec = date.getSeconds().toString().padStart(2,'0');
	return `${fmtDate}_${hrs}_${min}_${sec}`;
}