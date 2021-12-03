import { output, z } from "zod";
import { main } from "../../utils/host";

enum Bit {
    Zero = 0,
    One = 1,
}

type BitString = ReadonlyArray<Bit>;
type Counter = [zero: number, one: number];

type Input = ReadonlyArray<BitString>;
type Output = number;

const schema = z.preprocess(
    (value) => (value as string).split("").map((char) => parseInt(char)),
    z.array(z.nativeEnum(Bit))
);

const decimal = (bits: BitString): number =>
    bits.reduce(
        (sum, bit, index) => sum + bit * Math.pow(2, bits.length - index - 1),
        0
    );

const setup = (input: string): Input =>
    input.split("\n").map((line) => schema.parse(line));

const part1 = (input: Input): Output => {
    const counters: ReadonlyArray<Counter> = Array.from(
        { length: input[0].length },
        () => [0, 0]
    );
    for (const line of input) {
        for (const [index, bit] of line.entries()) {
            counters[index][bit]++;
        }
    }
    const gamma = decimal(
        counters.map((counter) => counter.indexOf(Math.max(...counter)) as Bit)
    );
    const epsilon = decimal(
        counters.map((counter) => counter.indexOf(Math.min(...counter)) as Bit)
    );
    return gamma * epsilon;
};

const seek = (
    input: Input,
    callback: (...values: number[]) => number,
    fallback: Bit
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

const part2 = (input: Input): Output => {
    const oxygen = seek(input, Math.max, Bit.One);
    const scrubber = seek(input, Math.min, Bit.Zero);
    return oxygen * scrubber;
};

main(module, { setup, part1, part2 });
