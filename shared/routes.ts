import { z } from 'zod';
import { insertWorksheetSchema, worksheets } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  worksheets: {
    generate: {
      method: 'POST' as const,
      path: '/api/worksheets/generate' as const,
      input: insertWorksheetSchema,
      responses: {
        200: z.custom<typeof worksheets.$inferSelect>(),
        400: errorSchemas.validation,
      }
    },
    get: {
      method: 'GET' as const,
      path: '/api/worksheets/:id' as const,
      responses: {
        200: z.custom<typeof worksheets.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  },
  answerKey: {
    get: {
      method: 'GET' as const,
      path: '/api/answer-key/:id' as const,
      responses: {
        200: z.custom<typeof worksheets.$inferSelect>(),
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type GenerateWorksheetInput = z.infer<typeof api.worksheets.generate.input>;
export type WorksheetResponse = z.infer<typeof api.worksheets.generate.responses[200]>;
