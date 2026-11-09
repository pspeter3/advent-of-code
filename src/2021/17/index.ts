import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, StringSchema } from "../../utils/schemas.ts";

type Vector = readonly [x: number, y: number];
interface Target {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const schema = z.preprocess(
  (input) => {
    const match = StringSchema.parse(input)
      .trim()
      .match(/^target area: x=(-?\d+)..(-?\d+), y=(-?\d+)..(-?\d+)$/);
    if (!match) {
      return null;
    }
    const [xMin, xMax, yMin, yMax] = match.slice(1, 5);
    return { xMin, xMax, yMin, yMax };
  },
  z.object({
    xMin: IntSchema,
    xMax: IntSchema,
    yMin: IntSchema,
    yMax: IntSchema,
  }),
);

const triangle = (n: number): number => 0.5 * n * (n + 1);

const add = ([x1, y1]: Vector, [x2, y2]: Vector): Vector => [x1 + x2, y1 + y2];
const drag = ([x, y]: Vector): Vector => [x - Math.sign(x), y - 1];

const contains = ({ xMin, xMax, yMin, yMax }: Target, [x, y]: Vector): boolean =>
  xMin <= x && x <= xMax && yMin <= y && y <= yMax;

const missed = ({ yMin }: Target, position: Vector): boolean => position[1] < yMin;

const hits = (target: Target, velocity: Vector): boolean => {
  let position: Vector = [0, 0];
  while (!missed(target, position)) {
    if (contains(target, position)) {
      return true;
    }
    position = add(position, velocity);
    velocity = drag(velocity);
  }
  return false;
};

const part1 = ({ yMin }: Target): number => triangle(Math.abs(yMin) - 1);

const part2 = (target: Target): number => {
  const { xMax, yMin } = target;
  let count = 0;
  for (let x = 0; x <= xMax; x++) {
    for (let y = yMin; y < Math.abs(yMin); y++) {
      const velocity: Vector = [x, y];
      if (hits(target, velocity)) {
        count++;
      }
    }
  }
  return count;
};

await main(import.meta, (input) => schema.parse(input), part1, part2);
