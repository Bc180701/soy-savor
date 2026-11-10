import { z } from "zod";

export const cateringQuoteSchema = z.object({
  audience: z.enum(["business", "private"]),
  name: z.string().trim().min(2, "Votre nom est requis.").max(100),
  email: z.string().trim().email("Adresse e-mail invalide.").max(255),
  phone: z.string().trim().regex(/^[+\d\s().-]{6,30}$/, "Numéro de téléphone invalide."),
  company: z.string().trim().max(150),
  event_type: z.string().trim().min(2, "Précisez le type d’événement.").max(150),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choisissez une date."),
  location: z.string().trim().min(2, "Précisez le lieu.").max(300),
  guests: z.coerce.number().int().min(1, "Indiquez le nombre de personnes.").max(100000),
  needs: z.string().trim().max(3000),
  website: z.string().max(0),
}).superRefine((value, ctx) => {
  if (value.audience === "business" && !value.company) {
    ctx.addIssue({ code: "custom", path: ["company"], message: "Indiquez le nom de l’entreprise." });
  }
});

export type CateringQuote = z.infer<typeof cateringQuoteSchema>;