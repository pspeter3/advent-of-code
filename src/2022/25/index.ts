import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";

const DIGITS = ["0", "1", "2", "=", "-"] as const;
const DigitSchema = z.enum(DIGITS);
type Digit = (typeof DIGITS)[number];
const VALUES = {
    "=": -2,
    "-": -1,
    "0": 0,
    "1": 1,
    "2": 2,
} as const;

type SNAFU = ReadonlyArray<Digit>;

const toDecimal = (snafu: SNAFU): number =>
    snafu.reduce(
        (sum, digit, index) =>
            sum + VALUES[digit] * Math.pow(5, snafu.length - index - 1),
        0,
    );

const toSNAFU = (value: number): string => {
    if (value === 0) {
        return "";
    }
    return toSNAFU(Math.floor((value + 2) / 5)) + DIGITS[value % 5];
};

const schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(""))
        .pipe(z.array(DigitSchema)),
);

const parse = (input: string): ReadonlyArray<SNAFU> => schema.parse(input);

const part1 = (snafus: ReadonlyArray<SNAFU>): string =>
    toSNAFU(snafus.reduce((sum, snafu) => sum + toDecimal(snafu), 0));

await main(import.meta, parse, part1);
