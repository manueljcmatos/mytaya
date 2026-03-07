import { z } from 'zod';

export const leadSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  lang: z.enum(['tl', 'en']).default('tl'),
});

export type LeadInput = z.infer<typeof leadSchema>;
