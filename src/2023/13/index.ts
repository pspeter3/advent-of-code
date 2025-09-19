import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";
import { sum, zip } from "../../common/itertools.ts";

type Pattern = ReadonlyArray<string>;
type PatternList = ReadonlyArray<Pattern>;

const PatternSchema = LinesSchema(z.string().regex(/^[\.#]+$/));
const PatternListSchema = z
    .string()
    .transform((input) => input.trim().split("\n\n"))
    .pipe(z.array(PatternSchema));

const diffLine = (line: string, index: number): number =>
    sum(
        zip(Array.from(line.slice(0, index)).reverse(), line.slice(index)).map(
            ([a, b]) => (a !== b ? 1 : 0),
        ),
    );

const diffPattern = (pattern: Pattern, index: number): number =>
    sum(pattern.values().map((line) => diffLine(line, index)));

function findIndex(pattern: Pattern, delta: number): number {
    for (let i = 1; i < pattern[0].length; i++) {
        if (diffPattern(pattern, i) === delta) {
            return i;
        }
    }
    return 0;
}

const score = (pattern: Pattern, delta: number): number =>
    findIndex(pattern, delta) + 100 * findIndex(rotate(pattern), delta);

const rotate = (pattern: Pattern): Pattern =>
    Array.from({ length: pattern[0].length }, (_, q) =>
        pattern.map((line) => line[q]).join(""),
    );

const parse = (input: string): PatternList => PatternListSchema.parse(input);

const part1 = (patterns: PatternList): number =>
    sum(patterns.values().map((pattern) => score(pattern, 0)));

const part2 = (patterns: PatternList): number =>
    sum(patterns.values().map((pattern) => score(pattern, 1)));

await main(import.meta, parse, part1, part2);
