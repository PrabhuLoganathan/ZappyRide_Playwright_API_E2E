const fs = require("fs")

export async function getExpectedData(jsonFile:string): Promise<JSON> {
	const fs = require('fs');
	const fsPromises = require('fs').promises;
	const jsonData = await fsPromises.readFile("./test-data/"+ jsonFile,'utf-8')
	return  JSON.parse(jsonData)
}

export async function writeAccessToken(data: string): Promise<void> {
	fs.writeFileSync("accessToken.txt", data, "utf8",{flag: "w"})
}

export async function readAccessToken(): Promise<string> {
	let data = fs.readFileSync("accessToken.txt")
	// console.log("KEY: " + data)
	return data
}