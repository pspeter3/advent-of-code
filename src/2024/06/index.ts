import {
  CardinalDirection,
  GridBounds2D,
  GridVector2D,
  GridVector2DMap,
  GridVector2DSet,
} from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";

interface Puzzle {
  readonly bounds: GridBounds2D;
  readonly guard: GridVector2D;
  readonly obstructions: GridVector2DSet;
}

const parse = (input: string): Puzzle => {
  const matrix = input
    .trim()
    .split("\n")
    .map((line) => line.trim().split(""));
  const bounds = GridBounds2D.fromOrigin({
    q: matrix[0].length,
    r: matrix.length,
  });
  let guard: GridVector2D | null = null;
  const obstructions = new GridVector2DSet(bounds);
  for (const [r, row] of matrix.entries()) {
    for (const [q, token] of row.entries()) {
      switch (token) {
        case "^": {
          guard = new GridVector2D(q, r);
          break;
        }
        case "#": {
          obstructions.add(new GridVector2D(q, r));
          break;
        }
      }
    }
  }
  if (guard === null) {
    throw new Error("Guard not found");
  }
  return { bounds, guard, obstructions };
};

const isObstruction = (
  bounds: GridBounds2D,
  obstructions: GridVector2DSet,
  curr: GridVector2D,
  dir: CardinalDirection,
): boolean => {
  const next = curr.neighbor(dir);
  return bounds.includes(next) && obstructions.has(next);
};

const turnRight = (dir: CardinalDirection): CardinalDirection =>
  ((dir + 1) % 4) as CardinalDirection;

const walk = ({
  bounds,
  guard,
  obstructions,
}: Puzzle): GridVector2DMap<ReadonlySet<CardinalDirection>> => {
  let curr = guard;
  let dir: CardinalDirection = CardinalDirection.North;
  const visited = new GridVector2DMap<Set<CardinalDirection>>(bounds);
  const visit = (cell: GridVector2D, dir: CardinalDirection): void => {
    if (!visited.has(cell)) {
      visited.set(cell, new Set());
    }
    const directions = visited.get(cell)!;
    if (directions.has(dir)) {
      throw new Error("Loop detected");
    }
    directions.add(dir);
  };
  while (bounds.includes(curr)) {
    visit(curr, dir);
    while (isObstruction(bounds, obstructions, curr, dir)) {
      dir = turnRight(dir);
    }
    curr = curr.neighbor(dir);
  }
  return visited;
};

const part1 = (puzzle: Puzzle): number => walk(puzzle).size;

const part2 = (puzzle: Puzzle): number => {
  const map = walk(puzzle);
  let count = 0;
  for (const cell of map.keys()) {
    puzzle.obstructions.add(cell);
    try {
      walk(puzzle);
    } catch (_) {
      count++;
    }
    puzzle.obstructions.delete(cell);
  }
  return count;
};

await main(import.meta, parse, part1, part2);
