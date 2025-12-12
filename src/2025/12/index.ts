import z from "zod";
import { GridVector2D, type GridVector2DRecord } from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { len, sum } from "../../common/itertools.ts";

interface Region {
    readonly size: GridVector2D;
    readonly list: ReadonlyArray<number>;
}

interface Puzzle {
    readonly presents: ReadonlyArray<number>;
    readonly regions: ReadonlyArray<Region>;
}

const IntTupleSchema = z.tuple([IntSchema, IntSchema]);
const IntListSchema = z.array(IntSchema);

const parse = (input: string): Puzzle => {
    const chunks = input.trim().split("\n\n");
    const presents = chunks
        .values()
        .take(chunks.length - 1)
        .map((chunk) =>
            sum(
                chunk
                    .split("\n")
                    .values()
                    .drop(1)
                    .map((line) =>
                        len(
                            line
                                .split("")
                                .values()
                                .filter((char) => char === "#"),
                        ),
                    ),
            ),
        )
        .toArray();
    const regions = chunks
        .at(-1)!
        .split("\n")
        .map((line) => {
            const [pair, rest] = line.split(": ");
            const size = GridVector2D.fromTuple(
                IntTupleSchema.parse(pair.split("x")),
            );
            const list = IntListSchema.parse(rest.split(" "));
            return { size, list };
        });
    return { presents, regions };
};

const toArea = ({ q, r }: GridVector2DRecord): number => q * r;

const part1 = ({ presents, regions }: Puzzle): number =>
    len(
        regions
            .values()
            .filter(
                ({ size, list }) =>
                    toArea(size) >=
                    sum(
                        list
                            .values()
                            .map((count, index) => count * presents[index]),
                    ),
            ),
    );

const part2 = (_: unknown): number => 0;

await main(import.meta, parse, part1, part2);
