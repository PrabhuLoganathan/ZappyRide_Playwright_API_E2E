import { z } from "zod";
// Schema generator: https://transform.tools/json-to-zod

export const projectsSchema = z.object({
	total: z.number(),
	page_number: z.number(),
	projects: z.array(
		z.object({
			id: z.number(),
			domain: z.string(),
			email: z.string(),
			name: z.string(),
			pointOfContact: z.string(),
			company: z.string(),
			useCase: z.string(),
			projectScope: z.string(),
			createdAt: z.string(),
			updatedAt: z.string()
		})
	)
})
