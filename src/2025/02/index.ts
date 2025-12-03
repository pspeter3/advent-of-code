import { sum } from "../../common/itertools.ts";
import { NumberRange } from "../../common/number-range.ts";
import { main } from "../../utils/host.ts";

const parse = (input: string): ReadonlyArray<NumberRange> =>
    input
        .trim()
        .split(",")
        .map((chunk) => {
            const [a, b] = chunk.split("-");
            return NumberRange.inclusive(parseInt(a, 10), parseInt(b, 10));
        });

const findInvalidIds = (
    range: NumberRange,
    pattern: RegExp,
): Iterable<number> =>
    range.values().filter((value) => value.toString().match(pattern));

type Solver = (ranges: ReadonlyArray<NumberRange>) => number;
type SolverFactory = (pattern: RegExp) => Solver;

const solve: SolverFactory = (pattern) => (ranges) =>
    sum(ranges.values().flatMap((range) => findInvalidIds(range, pattern)));

const part1 = solve(/^(\d+)\1$/);

const part2 = solve(/^(\d+)\1+$/);

await main(import.meta, parse, part1, part2);
