import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema, StringSchema } from "../../utils/schemas.ts";

const Bit = { Zero: 0, One: 1 } as const;
type Bit = (typeof Bit)[keyof typeof Bit];

type BitString = ReadonlyArray<Bit>;
type Counter = [zero: number, one: number];

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).split(""),
        z.array(
            z.preprocess(
                (char) => parseInt(StringSchema.parse(char)),
                z.nativeEnum(Bit),
            ),
        ),
    ),
);

const decimal = (bits: BitString): number => parseInt(bits.join(""), 2);

const part1 = (input: ReadonlyArray<BitString>): number => {
    const counters: ReadonlyArray<Counter> = Array.from(
        { length: input[0].length },
        () => [0, 0],
    );
    for (const line of input) {
        for (const [index, bit] of line.entries()) {
            counters[index][bit]++;
        }
    }
    const gamma = decimal(
        counters.map((counter) => counter.indexOf(Math.max(...counter)) as Bit),
    );
    const epsilon = decimal(
        counters.map((counter) => counter.indexOf(Math.min(...counter)) as Bit),
    );
    return gamma * epsilon;
};

const seek = (
    input: ReadonlyArray<BitString>,
    callback: (...values: number[]) => number,
    fallback: Bit,
): number => {
    let valid = input;
    const max = input[0].length;
    for (let index = 0; index < max; index++) {
        const counter: Counter = [0, 0];
        for (const line of valid) {
            counter[line[index]]++;
        }
        let bit = counter.indexOf(callback(...counter));
        if (counter[0] === counter[1]) {
            bit = fallback;
        }
        valid = valid.filter((line) => line[index] === bit);
        if (valid.length === 1) {
            return decimal(valid[0]);
        }
    }
    throw new Error("Could not find valid option");
};

const part2 = (input: ReadonlyArray<BitString>): number => {
    const oxygen = seek(input, Math.max, Bit.One);
    const scrubber = seek(input, Math.min, Bit.Zero);
    return oxygen * scrubber;
};

main(module, (input) => schema.parse(input), part1, part2);
