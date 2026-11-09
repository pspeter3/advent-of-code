import z from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema } from "../../utils/schemas.ts";
import { len, sum } from "../../common/itertools.ts";
import { memoize } from "../../common/functools.ts";

interface Puzzle {
  readonly towels: ReadonlyArray<string>;
  readonly designs: ReadonlyArray<string>;
}

const TowelSchema = z.string().regex(/^[wubrg]+$/);
const TowelListSchema = z
  .string()
  .transform((value) => value.trim().split(", "))
  .pipe(z.array(TowelSchema));
const DesignListSchema = LinesSchema(TowelSchema);
const PuzzleSchema = z
  .string()
  .transform((input) => {
    const [towels, designs] = input.trim().split("\n\n");
    return { towels, designs };
  })
  .pipe(z.object({ towels: TowelListSchema, designs: DesignListSchema }));

const match = memoize((towels: ReadonlyArray<string>, design: string): number => {
  if (design.length === 0) {
    return 1;
  }
  return sum(
    towels.map((towel) => {
      if (!design.startsWith(towel)) {
        return 0;
      }
      return match(towels, design.slice(towel.length));
    }),
  );
});

const parse = (input: string): Puzzle => PuzzleSchema.parse(input);

const part1 = ({ towels, designs }: Puzzle): number =>
  len(designs.values().filter((design) => match(towels, design) > 0));

const part2 = ({ towels, designs }: Puzzle): number =>
  sum(designs.values().map((design) => match(towels, design)));

await main(import.meta, parse, part1, part2);
