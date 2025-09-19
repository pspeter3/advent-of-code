import { z, type ZodType } from "zod";

export const StringSchema = z.string();
export const IntSchema = z.coerce.number<string>().int();

export const LinesSchema = <T extends ZodType>(schema: T) =>
    z
        .string()
        .transform((input) => input.trim().split("\n") as z.input<T>[])
        .pipe(z.array(schema));

export const MatrixSchema = <T extends ZodType>(schema: T) =>
    LinesSchema(
        z
            .string()
            .transform((line) => line.split("") as z.input<T>[])
            .pipe(z.array(schema)),
    );
