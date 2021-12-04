import { z, ZodTypeAny } from "zod";

export const StringSchema = z.string();
export const IntSchema = z.preprocess(
    (value) => parseInt(StringSchema.parse(value), 10),
    z.number().int()
);

export const LinesSchema = <T extends ZodTypeAny>(schema: T) =>
    z.preprocess(
        (input) => StringSchema.parse(input).trim().split("\n"),
        z.array(schema)
    );
