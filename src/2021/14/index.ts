import { z } from "zod";
import { main } from "../../utils/host";
import { LinesSchema, StringSchema } from "../../utils/schemas";

const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split("\n\n"),
    z.tuple([
        StringSchema,
        LinesSchema(
            z.preprocess(
                (line) => StringSchema.parse(line).trim().split(" -> "),
                z.tuple([StringSchema, StringSchema])
            )
        ),
    ])
);

type Replacement = readonly [pair: string, replacement: string];
type Input = readonly [
    template: string,
    replacements: ReadonlyArray<Replacement>
];

const increment = (
    counts: Map<string, number>,
    key: string,
    amount: number
): Map<string, number> => counts.set(key, (counts.get(key) ?? 0) + amount);

const tokenize = (template: string): ReadonlyMap<string, number> => {
    const tokens = new Map<string, number>();
    for (let i = 0; i < template.length - 1; i++) {
        increment(tokens, template.slice(i, i + 2), 1);
    }
    return tokens;
};

const replace = (
    tokens: ReadonlyMap<string, number>,
    replacements: ReadonlyMap<string, string>
): ReadonlyMap<string, number> => {
    const next = new Map(tokens);
    for (const [key, count] of tokens) {
        const insert = replacements.get(key);
        if (!insert) {
            throw new Error(`Could not find insert for ${key}`);
        }
        const pairs = key
            .split("")
            .map((char, i) =>
                (i === 0 ? [char, insert] : [insert, char]).join("")
            );
        for (const pair of pairs) {
            increment(next, pair, count);
        }
        increment(next, key, -1 * count);
    }
    return next;
};

const count = (tokens: ReadonlyMap<string, number>): ReadonlyArray<number> => {
    const counts = new Map<string, number>();
    for (const [token, count] of tokens) {
        increment(counts, token[1], count);
    }
    return Array.from(counts.values());
};

const evolve = ([template, pairs]: Input, steps: number): number => {
    const replacements = new Map(pairs);
    let tokens = tokenize(template);
    for (let step = 0; step < steps; step++) {
        tokens = replace(tokens, replacements);
    }
    const counts = count(tokens);
    return Math.max(...counts) - Math.min(...counts);
};

const part1 = (input: Input): number => evolve(input, 10);
const part2 = (input: Input): number => evolve(input, 40);

main(module, (input) => schema.parse(input), part1, part2);
