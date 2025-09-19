import { z, type ZodTypeAny } from "zod";

export const StringSchema = z.string();
export const IntSchema = z.coerce.number().int();
export const LinesSchema = <T extends ZodTypeAny>(schema: T) =>
    z
        .string()
        .transform((input) => input.trim().split("\n"))
        .pipe(z.array(schema));

export const MatrixSchema = <T extends ZodTypeAny>(schema: T) =>
    LinesSchema(
        z
            .string()
            .transform((line) => line.split(""))
            .pipe(z.array(schema)),
    );
