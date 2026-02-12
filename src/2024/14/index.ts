import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { DiagonalDirection } from "../../common/grid2d.ts";
import { chineseRemainderTheorem } from "../../common/math.ts";

interface Vector2DRecord {
  readonly x: number;
  readonly y: number;
}

interface Robot {
  readonly p: Vector2DRecord;
  readonly v: Vector2DRecord;
}

type RobotList = ReadonlyArray<Robot>;

const Vector2DRecordSchema = z.object({ x: IntSchema, y: IntSchema });

const RobotSchema = z
  .string()
  .transform((line) =>
    Object.fromEntries(
      line
        .split(" ")
        .values()
        .map((part) => {
          const [key, value] = part.split("=");
          const [x, y] = value.split(",");
          return [key, { x, y }];
        }),
    ),
  )
  .pipe(
    z.object({
      p: Vector2DRecordSchema,
      v: Vector2DRecordSchema,
    }),
  );

const RobotListSchema = LinesSchema(RobotSchema);

const Vector2DRecordKeys = ["x", "y"] as const;

const move = (robot: Robot, bounds: Vector2DRecord, steps: number): Vector2DRecord =>
  Object.fromEntries<number>(
    Vector2DRecordKeys.values().map((key) => {
      let value = (robot.p[key] + robot.v[key] * steps) % bounds[key];
      if (value < 0) {
        value += bounds[key];
      }
      return [key, value];
    }),
  ) as unknown as Vector2DRecord;

const toQuadrant = (vector: Vector2DRecord, mid: Vector2DRecord): DiagonalDirection | null => {
  if (vector.x === mid.x || vector.y === mid.y) {
    return null;
  }
  if (vector.x < mid.x) {
    return vector.y < mid.y ? DiagonalDirection.NorthEast : DiagonalDirection.SouthEast;
  }
  return vector.y < mid.y ? DiagonalDirection.NorthWest : DiagonalDirection.SouthWest;
};

const parse = (input: string): RobotList => RobotListSchema.parse(input);

const part1 = (robots: RobotList): number => {
  const bounds = robots.length === 12 ? { x: 11, y: 7 } : { x: 101, y: 103 };
  const mid: Vector2DRecord = {
    x: Math.floor(bounds.x / 2),
    y: Math.floor(bounds.y / 2),
  };
  return Map.groupBy(
    robots.values().map((robot) => move(robot, bounds, 100)),
    (vector) => toQuadrant(vector, mid),
  )
    .entries()
    .filter(([key, _]) => key !== null)
    .reduce((acc, [_, vectors]) => acc * vectors.length, 1);
};

type Entry = readonly [index: number, value: number];

const part2 = (robots: RobotList): number => {
  if (robots.length === 12) {
    return 0;
  }
  const bounds = { x: 101, y: 103 };
  const max = Math.max(bounds.x, bounds.y);
  let minX: Entry = [-1, Number.MAX_SAFE_INTEGER];
  let minY: Entry = [-1, Number.MAX_SAFE_INTEGER];
  for (let t = 0; t < max; t++) {
    const vectors = robots.map((robot) => move(robot, bounds, t));
    let xMean = 0;
    let yMean = 0;
    for (const { x, y } of vectors) {
      xMean += x;
      yMean += y;
    }
    xMean /= vectors.length;
    yMean /= vectors.length;
    let xVariance = 0;
    let yVariance = 0;
    for (const { x, y } of vectors) {
      xVariance += (x - xMean) ** 2;
      yVariance += (y - yMean) ** 2;
    }
    if (xVariance < minX[1]) {
      minX = [t, xVariance];
    }
    if (yVariance < minY[1]) {
      minY = [t, yVariance];
    }
  }
  return chineseRemainderTheorem(minX[0], bounds.x, minY[0], bounds.y);
};

await main(import.meta, parse, part1, part2);
