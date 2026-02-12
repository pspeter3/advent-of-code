import { Heap } from "heap-js";
import {
  CardinalDirection,
  GridBounds2D,
  GridVector2D,
  GridVector2DMap,
  GridVector2DSet,
} from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";

interface Maze {
  readonly bounds: GridBounds2D;
  readonly walls: ReadonlySet<GridVector2D>;
  readonly start: GridVector2D;
  readonly end: GridVector2D;
}

type MazeStep = readonly [pos: GridVector2D, dir: CardinalDirection];

interface MazeResult {
  readonly cost: number;
  readonly tiles: number;
}

const TURNS = [-1, 0, 1] as const;

const rotate = (dir: CardinalDirection, turn: -1 | 0 | 1): CardinalDirection => {
  let next = (dir + turn) % 4;
  if (next < 0) {
    next += 4;
  }
  return next as CardinalDirection;
};

class MazeVisitor {
  readonly #maze: Maze;
  readonly #cost: GridVector2DMap<Map<CardinalDirection, number>>;
  readonly #heap: Heap<MazeStep>;
  readonly #from: GridVector2DMap<Map<CardinalDirection, MazeStep[]>>;
  readonly #compare = (a: MazeStep, b: MazeStep) => this.#value(a) - this.#value(b);

  constructor(maze: Maze) {
    this.#maze = maze;
    this.#cost = new GridVector2DMap(this.#maze.bounds);
    this.#heap = new Heap<MazeStep>(this.#compare);
    this.#from = new GridVector2DMap(this.#maze.bounds);
  }

  solve(): MazeResult {
    const step = this.#visit();
    const cost = this.#cost.get(step[0])!.get(step[1])!;
    const paths = this.#tiles(step);
    const tiles = paths.size;
    return { cost, tiles };
  }

  #visit(): MazeStep {
    this.#add(null, [this.#maze.start, CardinalDirection.East], 0);
    for (const step of this.#heap) {
      const [pos, dir] = step;
      const cost = this.#value(step);
      if (pos.equals(this.#maze.end)) {
        return step;
      }
      for (const turn of TURNS) {
        const d = rotate(dir, turn);
        const next = pos.neighbor(d);
        if (this.#maze.walls.has(next)) {
          continue;
        }
        const delta = Math.abs(turn) * 1000 + 1;
        this.#add(step, [next, d], cost + delta);
      }
    }
    throw new Error("No solution found");
  }

  #add(from: MazeStep | null, step: MazeStep, cost: number): this {
    const [pos, dir] = step;
    const value = this.#cost.get(pos)?.get(dir);
    if (value !== undefined && value <= cost) {
      if (value === cost) {
        this.#track(from, step);
      }
      return this;
    }
    if (!this.#cost.has(pos)) {
      this.#cost.set(pos, new Map());
    }
    this.#cost.get(pos)!.set(dir, cost);
    this.#heap.push(step);
    this.#track(from, step);
    return this;
  }

  #value([pos, dir]: MazeStep): number {
    const value = this.#cost.get(pos)?.get(dir);
    if (value === undefined) {
      throw new Error("Step not found in cost map");
    }
    return value;
  }

  #track(from: MazeStep | null, step: MazeStep): void {
    if (from === null) {
      return;
    }
    const [pos, dir] = step;
    if (!this.#from.has(pos)) {
      this.#from.set(pos, new Map());
    }
    if (!this.#from.get(pos)!.has(dir)) {
      this.#from.get(pos)!.set(dir, []);
    }
    this.#from.get(pos)!.get(dir)!.push(from);
  }

  #tiles(step: MazeStep): GridVector2DSet {
    const tiles = new GridVector2DSet(this.#maze.bounds);
    const frontier: MazeStep[] = [step];
    for (const s of frontier) {
      const [pos, dir] = s;
      tiles.add(pos);
      for (const next of this.#from.get(pos)?.get(dir) ?? []) {
        frontier.push(next);
      }
    }
    return tiles;
  }
}

const parse = (input: string): MazeResult => {
  const matrix = input
    .trim()
    .split("\n")
    .map((line) => line.split(""));
  const bounds = GridBounds2D.fromOrigin({
    q: matrix[0].length,
    r: matrix.length,
  });
  const walls = new GridVector2DSet(
    bounds,
    bounds.values().filter((v) => matrix[v.r][v.q] === "#"),
  );
  const start = bounds.values().find((v) => matrix[v.r][v.q] === "S")!;
  const end = bounds.values().find((v) => matrix[v.r][v.q] === "E")!;
  const visitor = new MazeVisitor({ bounds, walls, start, end });
  return visitor.solve();
};

const part1 = ({ cost }: MazeResult): number => cost;

const part2 = ({ tiles }: MazeResult): number => tiles;

await main(import.meta, parse, part1, part2);
