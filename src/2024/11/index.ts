import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";
import { memoize } from "../../common/functools.ts";

type StoneList = ReadonlyArray<number>;

const StoneListSchema = z
  .string()
  .transform((input) => input.trim().split(" "))
  .pipe(z.array(IntSchema));

const parse = (input: string): StoneList => StoneListSchema.parse(input);

const MAX_DEPTH = 75;

/**
 * Packs stone and depth into a single number, falling back to a string if the
 * stone is too large to pack safely.
 */
const blinkKey = (stone: number, depth: number): number | string => {
  const key = stone * (MAX_DEPTH + 1) + depth;
  return Number.isSafeInteger(key) ? key : `${depth}:${stone}`;
};

const blink = memoize((stone: number, depth: number): number => {
  if (depth === 0) {
    return 1;
  }
  const next = depth - 1;
  if (stone === 0) {
    return blink(1, next);
  }
  const str = stone.toString(10);
  if (str.length % 2 === 0) {
    const mid = str.length / 2;
    return blink(parseInt(str.slice(0, mid), 10), next) + blink(parseInt(str.slice(mid), 10), next);
  }
  return blink(stone * 2024, next);
}, blinkKey);

const part1 = (stones: StoneList): number => sum(stones.values().map((stone) => blink(stone, 25)));

const part2 = (stones: StoneList): number =>
  sum(stones.values().map((stone) => blink(stone, MAX_DEPTH)));

await main(import.meta, parse, part1, part2);
