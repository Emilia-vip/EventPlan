import { z } from "zod";

export const idSchema = z.uuid();

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Titel krävs").max(200),
  description: z.string().trim().max(5000).default(""),
  location: z.string().trim().max(200).default(""),
  startsAt: z.coerce
    .date({ error: "Ogiltigt datum" })
    .refine((d) => d.getTime() > Date.now(), "Eventet måste ligga i framtiden"),
  capacity: z.number().int().min(1, "Minst 1 plats").max(100_000),
});

export const registrationSchema = z.object({
  name: z.string().trim().min(1, "Namn krävs").max(200),
  email: z.string().trim().toLowerCase().pipe(z.email("Ogiltig e-postadress")),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type RegistrationInput = z.infer<typeof registrationSchema>;