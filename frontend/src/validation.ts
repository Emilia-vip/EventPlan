import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title can be at most 200 characters"),
  description: z.string().trim().max(5000, "Description can be at most 5000 characters").default(""),
  location: z.string().trim().max(200, "Location can be at most 200 characters").default(""),
  startsAt: z.coerce
    .date({ error: "Invalid date" })
    .refine((d) => d.getTime() > Date.now(), "The event must be in the future"),
  capacity: z.coerce
    .number({ error: "Invalid number of spots" })
    .int("Invalid number of spots")
    .min(1, "At least 1 spot")
    .max(100_000, "At most 100000 spots"),
});

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200, "Name can be at most 200 characters"),
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200, "Password can be at most 200 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
  password: z.string().min(1, "Password is required"),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;


export function parseForm<T extends z.ZodType>(
  schema: T,
  form: FormData,
): { ok: true; data: z.output<T> } | { ok: false; message: string } {
  const result = schema.safeParse(Object.fromEntries(form));
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, message: result.error.issues[0]?.message ?? "Invalid data" };
}
