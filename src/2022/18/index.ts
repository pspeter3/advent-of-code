import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

class Voxel {
  private static readonly Neighbors: ReadonlyArray<Voxel> = [
    new Voxel(1, 0, 0),
    new Voxel(-1, 0, 0),
    new Voxel(0, 1, 0),
    new Voxel(0, -1, 0),
    new Voxel(0, 0, 1),
    new Voxel(0, 0, -1),
  ];

  readonly x: number;
  readonly y: number;
  readonly z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  get id(): string {
    const { x, y, z } = this;
    return [x, y, z].join(",");
  }

  add({ x, y, z }: Voxel): Voxel {
    return new Voxel(this.x + x, this.y + y, this.z + z);
  }

  *neighbors(): IterableIterator<Voxel> {
    for (const neighbor of Voxel.Neighbors) {
      yield this.add(neighbor);
    }
  }
}

const schema = LinesSchema(
  z
    .string()
    .transform((line) => line.split(","))
    .pipe(z.tuple([IntSchema, IntSchema, IntSchema]).transform(([x, y, z]) => new Voxel(x, y, z))),
);

const parse = (input: string): ReadonlyArray<Voxel> => schema.parse(input);

const part1 = (voxels: ReadonlyArray<Voxel>): number => {
  const ids = new Set(voxels.map(({ id }) => id));
  let faces = 0;
  for (const voxel of voxels) {
    for (const neighbor of voxel.neighbors()) {
      if (!ids.has(neighbor.id)) {
        faces++;
      }
    }
  }
  return faces;
};

class Range {
  min: number;
  max: number;

  constructor() {
    this.min = Infinity;
    this.max = -Infinity;
  }

  sample(value: number): void {
    this.min = Math.min(value, this.min);
    this.max = Math.max(value, this.max);
  }

  contains(value: number): boolean {
    return value >= this.min && value <= this.max;
  }

  *[Symbol.iterator](): IterableIterator<number> {
    for (let i = this.min; i <= this.max; i++) {
      yield i;
    }
  }
}

class Bounds {
  readonly x: Range;
  readonly y: Range;
  readonly z: Range;

  constructor() {
    this.x = new Range();
    this.y = new Range();
    this.z = new Range();
  }

  sample({ x, y, z }: Voxel): void {
    this.x.sample(x);
    this.y.sample(y);
    this.z.sample(z);
  }

  contains({ x, y, z }: Voxel): boolean {
    return this.x.contains(x) && this.y.contains(y) && this.z.contains(z);
  }

  *box(): IterableIterator<Voxel> {
    for (const y of this.y) {
      for (const z of this.z) {
        yield new Voxel(this.x.min - 1, y, z);
        yield new Voxel(this.x.max + 1, y, z);
      }
    }
    for (const x of this.x) {
      for (const z of this.z) {
        yield new Voxel(x, this.y.min - 1, z);
        yield new Voxel(x, this.y.max + 1, z);
      }
    }
    for (const x of this.x) {
      for (const y of this.y) {
        yield new Voxel(x, y, this.z.min - 1);
        yield new Voxel(x, y, this.z.max + 1);
      }
    }
  }
}

const part2 = (voxels: ReadonlyArray<Voxel>): number => {
  const solid = new Set<string>();
  const bounds = new Bounds();
  for (const voxel of voxels) {
    const { id } = voxel;
    solid.add(id);
    bounds.sample(voxel);
  }
  const air = new Set<string>();
  const queue: Voxel[] = [];
  const add = (voxel: Voxel): void => {
    air.add(voxel.id);
    queue.push(voxel);
  };
  for (const voxel of bounds.box()) {
    add(voxel);
  }
  for (const voxel of queue) {
    for (const neighbor of voxel.neighbors()) {
      const { id } = neighbor;
      if (bounds.contains(neighbor) && !solid.has(id) && !air.has(id)) {
        add(neighbor);
      }
    }
  }
  let faces = 0;
  for (const voxel of voxels) {
    for (const neighbor of voxel.neighbors()) {
      if (air.has(neighbor.id)) {
        faces++;
      }
    }
  }
  return faces;
};

await main(import.meta, parse, part1, part2);
