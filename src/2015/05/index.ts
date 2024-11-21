import { len } from "../../common/itertools";
import { main } from "../../utils/host";

const parse = (input: string): ReadonlyArray<string> =>
    input.trim().split("\n");

const part1 = (lines: ReadonlyArray<string>): number =>
    len(
        lines.values().filter((line) => {
            const vowels = line.match(/[aeiou]/g)?.length ?? 0;
            const doubles = line.match(/(.)\1/) !== null;
            const illegal = line.match(/ab|cd|pq|xy/) !== null;
            return vowels >= 3 && doubles && !illegal;
        }),
    );

const part2 = (lines: ReadonlyArray<string>): number =>
    len(
        lines.values().filter((line) => {
            const pairs = line.match(/(..).*\1/) !== null;
            const gap = line.match(/(.).\1/) !== null;
            return pairs && gap;
        }),
    );

main(module, parse, part1, part2);
