import { main } from "../../utils/host.ts";

const parse = (input: string): ReadonlyArray<string> =>
    input.trim().split("\n");

const toValue = (line: string): number => {
    const digits = Array.from(line)
        .map((char) => parseInt(char, 10))
        .filter((char) => !Number.isNaN(char));
    return 10 * digits.at(0)! + digits.at(-1)!;
};

const DIGITS = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
];

const transform = (line: string): string =>
    DIGITS.reduce(
        (result, pattern, index) =>
            result.replaceAll(
                pattern,
                `${pattern.at(0)}${index + 1}${pattern.at(-1)}`,
            ),
        line,
    );

const part1 = (input: ReadonlyArray<string>): number =>
    input.reduce((sum, line) => sum + toValue(line), 0);

const part2 = (input: ReadonlyArray<string>): number =>
    input.reduce((sum, line) => sum + toValue(transform(line)), 0);

await main(import.meta, parse, part1, part2);
