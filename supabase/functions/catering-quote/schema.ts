import { z } from "npm:zod@3";

export const OWNER_EMAIL = "contact@sushieats.fr";
export const quoteSchema = z.object({
  audience: z.enum(["business", "private"]),
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255).transform(v => v.toLowerCase()),
  phone: z.string().trim().regex(/^[+\d\s().-]{6,30}$/),
  company: z.string().trim().max(150),
  event_type: z.string().trim().min(2).max(150),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
  }),
  location: z.string().trim().min(2).max(300),
  guests: z.number().int().min(1).max(100000),
  needs: z.string().trim().max(3000),
  website: z.string().max(0),
}).refine(v => v.audience !== "business" || v.company.length > 0);