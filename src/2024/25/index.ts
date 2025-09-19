import { len, sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

type Pin = 0 | 1 | 2 | 3 | 4 | 5;
type Tumbler = readonly [Pin, Pin, Pin, Pin, Pin];

interface Puzzle {
    readonly locks: ReadonlyArray<Tumbler>;
    readonly keys: ReadonlyArray<Tumbler>;
}

const parse = (input: string): Puzzle => {
    const locks: Tumbler[] = [];
    const keys: Tumbler[] = [];
    for (const chunk of input.trim().split("\n\n")) {
        const matrix = chunk.split("\n").map((line) => line.split(""));
        const isLock = matrix[0][0] === "#";
        const tumbler = Array.from({ length: 5 }, (_, q) => {
            let count = 0;
            for (let r = 1; r < 6; r++) {
                if (matrix[r][q] === "#") {
                    count++;
                }
            }
            return count;
        }) as unknown as Tumbler;
        if (isLock) {
            locks.push(tumbler);
        } else {
            keys.push(tumbler);
        }
    }
    return { locks, keys };
};

const part1 = ({ locks, keys }: Puzzle): number =>
    sum(
        keys
            .values()
            .map((key) =>
                len(
                    locks
                        .values()
                        .filter((lock) =>
                            key.every((pin, index) => pin + lock[index] <= 5),
                        ),
                ),
            ),
    );

const part2 = (_: unknown): number => 0;

await main(import.meta, parse, part1, part2);
