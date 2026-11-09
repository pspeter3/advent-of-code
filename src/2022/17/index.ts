import { z } from "zod";
import { main } from "../../utils/host.ts";

const Direction = { Left: "<", Right: ">" } as const;
type Direction = (typeof Direction)[keyof typeof Direction];

class Grid {
  readonly width: number;

  constructor(width: number) {
    this.width = width;
  }

  x(id: number): number {
    return id % this.width;
  }

  y(id: number): number {
    return Math.floor(id / this.width);
  }

  id(x: number, y: number): number | null {
    if (x < 0 || x >= this.width || y < 0) {
      return null;
    }
    return y * this.width + x;
  }
}

interface GridTile {
  readonly x: number;
  readonly y: number;
}

class Shape {
  private static Row: ReadonlyArray<GridTile> = [
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 5, y: 0 },
  ];

  private static Cross: ReadonlyArray<GridTile> = [
    { x: 2, y: 1 },
    { x: 3, y: 1 },
    { x: 4, y: 1 },
    { x: 3, y: 2 },
    { x: 3, y: 0 },
  ];

  private static L: ReadonlyArray<GridTile> = [
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 1 },
    { x: 4, y: 2 },
  ];

  private static Column: ReadonlyArray<GridTile> = [
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 2, y: 3 },
  ];

  private static Square: ReadonlyArray<GridTile> = [
    { x: 2, y: 0 },
    { x: 3, y: 0 },
    { x: 2, y: 1 },
    { x: 3, y: 1 },
  ];

  static Templates: ReadonlyArray<ReadonlyArray<GridTile>> = [
    Shape.Row,
    Shape.Cross,
    Shape.L,
    Shape.Column,
    Shape.Square,
  ];

  static create(grid: Grid, index: number, base: number): Shape {
    return new Shape(
      grid,
      Shape.Templates[index % Shape.Templates.length].map(({ x, y }) => {
        const id = grid.id(x, y + base);
        if (id === null) {
          throw new Error("Invalid template");
        }
        return id;
      }),
    );
  }

  readonly grid: Grid;
  readonly rocks: ReadonlyArray<number>;

  constructor(grid: Grid, rocks: ReadonlyArray<number>) {
    this.grid = grid;
    this.rocks = rocks;
  }

  get top(): number {
    return this.rocks.reduce((max, rock) => Math.max(max, this.grid.y(rock)), -Infinity);
  }

  push(direction: Direction, rocks: ReadonlySet<number>): Shape | null {
    const next: number[] = [];
    const delta = direction === Direction.Left ? -1 : 1;
    for (const rock of this.rocks) {
      const x = this.grid.x(rock);
      const y = this.grid.y(rock);
      const id = this.grid.id(x + delta, y);
      if (id === null || rocks.has(id)) {
        return null;
      }
      next.push(id);
    }
    return new Shape(this.grid, next);
  }

  fall(): Shape | null {
    const next: number[] = [];
    for (const rock of this.rocks) {
      const x = this.grid.x(rock);
      const y = this.grid.y(rock);
      const id = this.grid.id(x, y - 1);
      if (id === null) {
        return null;
      }
      next.push(id);
    }
    return new Shape(this.grid, next);
  }
}

const schema = z.array(z.enum(Direction));

const parse = (input: string): ReadonlyArray<Direction> => schema.parse(input.trim().split(""));

const drop = (rocks: ReadonlySet<number>, jets: Iterator<Direction>, shape: Shape): Shape => {
  while (true) {
    const direction = (jets.next() as IteratorYieldResult<Direction>).value;
    shape = shape.push(direction, rocks) ?? shape;
    const down = shape.fall();
    if (down === null) {
      return shape;
    }
    for (const rock of down.rocks) {
      if (rocks.has(rock)) {
        return shape;
      }
    }
    shape = down;
  }
};

class JetStream implements Iterator<Direction> {
  readonly directions: ReadonlyArray<Direction>;
  private i: number;

  constructor(directions: ReadonlyArray<Direction>) {
    this.directions = directions;
    this.i = 0;
  }

  current(): number {
    return this.i % this.directions.length;
  }

  next(): IteratorYieldResult<Direction> {
    return {
      value: this.directions[this.i++ % this.directions.length],
    };
  }
}

const part1 = (directions: ReadonlyArray<Direction>): number => {
  const grid = new Grid(7);
  const rocks = new Set<number>();
  const jets = new JetStream(directions);
  let max = 0;
  for (let i = 0; i < 2022; i++) {
    const start = Shape.create(grid, i, max + 3);
    const shape = drop(rocks, jets, start);
    for (const rock of shape.rocks) {
      rocks.add(rock);
    }
    max = Math.max(max, shape.top + 1);
  }
  return max;
};

interface CachedTower {
  readonly i: number;
  readonly max: number;
}

interface CyclicTower extends CachedTower {
  readonly cycle: number;
  readonly delta: number;
}

const part2 = (directions: ReadonlyArray<Direction>): number => {
  const total = 1000000000000;
  const grid = new Grid(7);
  const rocks = new Set<number>();
  const jets = new JetStream(directions);
  let columns = Array.from({ length: grid.width }, () => 0);
  const states = new Map<string, CachedTower>();
  let tower: CyclicTower | null = null;
  for (let i = 0; i < total; i++) {
    const start = Shape.create(grid, i, Math.max(...columns) + 3);
    const shape = drop(rocks, jets, start);
    for (const rock of shape.rocks) {
      const x = grid.x(rock);
      const y = grid.y(rock) + 1;
      columns[x] = Math.max(columns[x], y);
      rocks.add(rock);
    }
    const max = Math.max(...columns);
    const depths = columns.map((value) => max - value);
    const d = jets.current();
    const s = i % Shape.Templates.length;
    const key = JSON.stringify([d, s, depths]);
    const state = states.get(key);
    if (state !== undefined) {
      tower = {
        i,
        max,
        cycle: i - state.i,
        delta: max - state.max,
      };
      break;
    }
    states.set(key, { i, max });
  }
  if (tower === null) {
    throw new Error(`Invalid cycle`);
  }
  const cycles = Math.floor((total - tower.i) / tower.cycle);
  const start = tower.i + tower.cycle * cycles;
  const base = tower.max + tower.delta * cycles;
  let max = Math.max(...columns);
  const height = max;
  for (let i = start + 1; i < total; i++) {
    const start = Shape.create(grid, i, max + 3);
    const shape = drop(rocks, jets, start);
    for (const rock of shape.rocks) {
      rocks.add(rock);
    }
    max = Math.max(max, shape.top + 1);
  }
  return base + (max - height);
};

await main(import.meta, parse, part1, part2);
