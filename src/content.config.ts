import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			summary: z.string(),
			blurb: z.string().max(90).optional(), // one-liner for the work list; falls back to summary
			datasetSize: z.string().optional(), // e.g. "149,116 rows" — shown in the detail panel
			stack: z.array(z.string()),
			liveUrl: z.string().url(),
			repoUrl: z.string().url(),
			featured: z.boolean().default(false),
			order: z.number(),
			cover: image(),
			coverAlt: z.string(),
		}),
});

export const collections = { projects };
