import z from "zod";
import { main } from "../../utils/host";
import { LinesSchema } from "../../utils/schemas";

type Pattern = ReadonlyArray<string>;
type PatternList = ReadonlyArray<Pattern>;

const PatternSchema = LinesSchema(z.string().regex(/^[\.#]+$/));
const PatternListSchema = z
    .string()
    .transform((input) => input.trim().split("\n\n"))
    .pipe(z.array(PatternSchema));

type Pair<T> = readonly [a: T, b: T];

function* zip<T>(a: Iterable<T>, b: Iterable<T>): Iterable<Pair<T>> {
    const aIterator = a[Symbol.iterator]();
    const bIterator = b[Symbol.iterator]();
    let aResult = aIterator.next();
    let bResult = bIterator.next();
    while (!aResult.done && !bResult.done) {
        yield [aResult.value, bResult.value];
        aResult = aIterator.next();
        bResult = bIterator.next();
    }
}

function* map<T, R>(
    iterable: Iterable<T>,
    callback: (value: T) => R,
): Iterable<R> {
    for (const item of iterable) {
        yield callback(item);
    }
}

function sum(iterable: Iterable<number>): number {
    let result = 0;
    for (const value of iterable) {
        result += value;
    }
    return result;
}

const diffLine = (line: string, index: number): number =>
    sum(
        map(
            zip(Array.from(line.slice(0, index)).reverse(), line.slice(index)),
            ([a, b]) => (a !== b ? 1 : 0),
        ),
    );

const diffPattern = (pattern: Pattern, index: number): number =>
    sum(map(pattern, (line) => diffLine(line, index)));

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
    sum(map(patterns, (pattern) => score(pattern, 0)));

const part2 = (patterns: PatternList): number =>
    sum(map(patterns, (pattern) => score(pattern, 1)));

main(module, parse, part1, part2);
