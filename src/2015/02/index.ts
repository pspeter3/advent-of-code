import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { min, sum } from "../../common/itertools.ts";

type Box = readonly [l: number, w: number, h: number];
type BoxList = ReadonlyArray<Box>;

const BoxSchema = z
  .string()
  .transform((line) => line.split("x"))
  .pipe(z.tuple([IntSchema, IntSchema, IntSchema]));
const BoxListSchema = LinesSchema(BoxSchema);

const parse = (input: string): BoxList => BoxListSchema.parse(input);

const part1 = (boxes: BoxList): number =>
  sum(
    boxes.values().map(([l, w, h]) => {
      const sides = [l * w, w * h, h * l];
      return sum(sides.values().map((side) => 2 * side)) + min(sides);
    }),
  );

const part2 = (boxes: BoxList): number =>
  sum(
    boxes.values().map(([l, w, h]) => {
      const perimeters = [2 * l + 2 * w, 2 * w + 2 * h, 2 * h + 2 * l];
      return l * w * h + min(perimeters);
    }),
  );

await main(import.meta, parse, part1, part2);
