import z from "zod";
import { GridVector2D } from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { max } from "../../common/itertools.ts";

const Vector2DTupleSchema = z.tuple([IntSchema, IntSchema]);

type GridVector2DList = ReadonlyArray<GridVector2D>;

const parse = (input: string): ReadonlyArray<GridVector2D> =>
    input
        .trim()
        .split("\n")
        .map((line) =>
            GridVector2D.fromTuple(Vector2DTupleSchema.parse(line.split(","))),
        );

const keys = ["q", "r"] as const;

function* areas(list: GridVector2DList): Generator<number> {
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            yield keys
                .values()
                .map((k) => Math.abs(list[i][k] - list[j][k] + 1))
                .reduce((a, e) => a * e);
        }
    }
}

const part1 = (list: GridVector2DList): number => max(areas(list));

const part2 = (_: GridVector2DList): number => 0;

await main(import.meta, parse, part1, part2);
