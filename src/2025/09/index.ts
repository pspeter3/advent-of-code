import z from "zod";
import { GridBounds2D, GridVector2D, type GridVector2DRecord } from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";
import { IntSchema } from "../../utils/schemas.ts";
import { max, pairs, type Pair } from "../../common/itertools.ts";

const Vector2DTupleSchema = z.tuple([IntSchema, IntSchema]);

type GridVector2DList = ReadonlyArray<GridVector2D>;

const parse = (input: string): ReadonlyArray<GridVector2D> =>
  input
    .trim()
    .split("\n")
    .map((line) => GridVector2D.fromTuple(Vector2DTupleSchema.parse(line.split(","))));

const toBounds = ([a, b]: Pair<GridVector2D>): GridBounds2D => GridBounds2D.inclusive(a, b);

const part1 = (vectors: GridVector2DList): number =>
  max(pairs(vectors).map((pair) => toBounds(pair).area));

type NumberRangeList = ReadonlyArray<Pair<number>>;
type ScanLineMap = ReadonlyMap<number, NumberRangeList>;

class Polygon {
  static #toEntries(set: Set<number>): IteratorObject<[number, Array<Pair<number>>]> {
    return Array.from(set)
      .sort((a, b) => a - b)
      .values()
      .map((i) => [i, []]);
  }
  readonly horizontal: ScanLineMap;
  readonly vertical: ScanLineMap;

  constructor(vectors: GridVector2DList) {
    const cols = new Set<number>();
    const rows = new Set<number>();
    for (const { q, r } of vectors) {
      cols.add(q);
      rows.add(r);
    }
    const horizontal = new Map(Polygon.#toEntries(rows));
    const vertical = new Map(Polygon.#toEntries(cols));
    for (const [index, curr] of vectors.entries()) {
      const prev = vectors.at(index - 1)!;
      if (prev.q !== curr.q && prev.r !== curr.r) {
        throw new Error("Diagonal line segment");
      }
      const isHorizontal = prev.r === curr.r;
      const map = isHorizontal ? horizontal : vertical;
      const key = curr[isHorizontal ? "r" : "q"];
      const valueKey = isHorizontal ? "q" : "r";
      if (!map.has(key)) {
        map.set(key, []);
      }
      const a = prev[valueKey];
      const b = curr[valueKey];
      map.get(key)!.push([Math.min(a, b), Math.max(a, b)]);
    }
    for (const map of [horizontal, vertical]) {
      for (const list of map.values()) {
        list.sort((a, b) => a[0] - b[0]);
      }
    }
    this.horizontal = horizontal;
    this.vertical = vertical;
  }

  includes({ q, r }: GridVector2DRecord): boolean {
    const { vertical } = this;
    if (vertical.get(q)?.some(([min, max]) => r >= min && r <= max) ?? false) {
      return true;
    }
    let count = 0;
    for (const [col, ranges] of this.vertical) {
      if (col >= q) {
        break;
      }
      if (ranges.some(([min, max]) => r >= min && r < max)) {
        count++;
      }
    }
    return count % 2 === 1;
  }

  intersects(bounds: GridBounds2D): boolean {
    for (const [row, ranges] of this.horizontal) {
      if (row <= bounds.min.r || row >= bounds.max.r - 1) {
        continue;
      }
      if (
        ranges.some(
          ([min, max]) =>
            (min < bounds.min.q && max > bounds.min.q) ||
            (min < bounds.max.q - 1 && max > bounds.max.q - 1),
        )
      ) {
        return true;
      }
    }
    for (const [col, ranges] of this.vertical) {
      if (col <= bounds.min.q || col >= bounds.max.q - 1) {
        continue;
      }
      if (
        ranges.some(
          ([min, max]) =>
            (min < bounds.min.r && max > bounds.min.r) ||
            (min < bounds.max.r - 1 && max > bounds.max.r - 1),
        )
      ) {
        return true;
      }
    }
    return false;
  }
}

function* corners([a, b]: Pair<GridVector2D>): Generator<GridVector2D> {
  yield new GridVector2D(a.q, b.r);
  yield new GridVector2D(b.q, a.r);
}

const part2 = (vectors: GridVector2DList): number => {
  const polygon = new Polygon(vectors);
  return max(
    pairs(vectors)
      .filter((pair) => corners(pair).every((v) => polygon.includes(v)))
      .map(toBounds)
      .filter((bounds) => !polygon.intersects(bounds))
      .map((bounds) => bounds.area),
  );
};

await main(import.meta, parse, part1, part2);
