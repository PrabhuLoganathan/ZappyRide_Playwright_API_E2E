import { expect } from "@playwright/test";
import { ZodSchema } from "zod";
// const Ajv = require("ajv");
// export async function schemaValidation(
// 	schema: any,
// 	jsonObj: any | number
// ): Promise<void> {
// 	const ajv = new Ajv();
// 	const validate = ajv.compile(schema);
// 	const valid = validate(jsonObj);
// 	if (!valid) {
// 		console.error("AJV Validation Errors:", ajv.errorsText(validate.errors));
// 	}
// 	expect(valid).toBe(true);
// }

export async function zodSchemaValidation(schema: ZodSchema, data: unknown) {
	const schemaValidation = await schema.safeParseAsync(data);
	if (!schemaValidation.success)
		console.error("Schema validation errors:", schemaValidation.error.issues);
	expect(schemaValidation.success).toBeTruthy();
}

export async function writeJsonFile(jsonFile: any, data: string) {
	const fs = require("fs");
	fs.writeFileSync("test-data/" + jsonFile, JSON.stringify(data), {
		encoding: "utf8",
	});
}

export async function overWriteJsonFile(jsonFile: any, dataFile: string) {
	const fs = require("fs");
	const newData = fs.readFileSync("test-data/" + dataFile);
	let curJson = JSON.parse(newData);
	fs.writeFileSync("test-data/" + jsonFile, JSON.stringify(curJson), {
		encoding: "utf8",
	});
}
