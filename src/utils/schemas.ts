import { z, ZodTypeAny } from "zod";

export const StringSchema = z.string();
export const IntSchema = z.coerce.number().int();
export const LinesSchema = <T extends ZodTypeAny>(schema: T) =>
    z
        .string()
        .transform((input) => input.trim().split("\n"))
        .pipe(z.array(schema));
