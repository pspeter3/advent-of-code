import { z } from "zod";
import { main } from "../../utils/host";
import { LinesSchema, StringSchema } from "../../utils/schemas";

const OpenSchema = z.enum(["(", "[", "{", "<"]);
const CloseSchema = z.enum([")", "}", "]", ">"]);
const CharactersSchema = z.union([OpenSchema, CloseSchema]);

type Opener = z.infer<typeof OpenSchema>;
type Closer = z.infer<typeof CloseSchema>;
type Character = z.infer<typeof CharactersSchema>;

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).split(""),
        z.array(CharactersSchema),
    ),
);

const Closers: Readonly<Record<Opener, Closer>> = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">",
};

const Openers: Readonly<Record<Closer, Opener>> = {
    ")": "(",
    "]": "[",
    "}": "{",
    ">": "<",
};

const CorruptedScores: Readonly<Record<Closer, number>> = {
    ")": 3,
    "]": 57,
    "}": 1197,
    ">": 25137,
};

const IncompleteScores: Readonly<Record<Closer, number>> = {
    ")": 1,
    "]": 2,
    "}": 3,
    ">": 4,
};

const isCloser = (char: Character): char is Closer =>
    CloseSchema.safeParse(char).success;

const part1 = (lines: ReadonlyArray<ReadonlyArray<Character>>): number => {
    const corrupted: Closer[] = [];
    for (const line of lines) {
        const stack: Character[] = [];
        for (const char of line) {
            if (!isCloser(char)) {
                stack.push(char);
                continue;
            }
            const top: Character | undefined = stack[stack.length - 1];
            if (Openers[char] !== top) {
                corrupted.push(char);
                break;
            }
            stack.pop();
        }
    }
    return corrupted.reduce((sum, char) => sum + CorruptedScores[char], 0);
};

const part2 = (lines: ReadonlyArray<ReadonlyArray<Character>>): number => {
    const scores: number[] = [];
    for (const line of lines) {
        const stack: Character[] = [];
        let corrupted = false;
        for (const char of line) {
            if (!isCloser(char)) {
                stack.push(char);
                continue;
            }
            const top: Character | undefined = stack[stack.length - 1];
            if (Openers[char] !== top) {
                corrupted = true;
                break;
            }
            stack.pop();
        }
        if (!corrupted && stack.length > 0) {
            scores.push(
                stack
                    .reverse()
                    .reduce(
                        (score, char) =>
                            5 * score +
                            IncompleteScores[Closers[OpenSchema.parse(char)]],
                        0,
                    ),
            );
        }
    }
    return scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)];
};

main(module, (input) => schema.parse(input), part1, part2);
