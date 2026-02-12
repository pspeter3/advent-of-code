import { fromCantor, fromZigZag, toCantor, toZigZag } from "./math.ts";

export interface GridVector2DRecord {
  readonly q: number;
  readonly r: number;
}

export type GridVector2DTuple = readonly [q: number, r: number];

export const CardinalDirection = {
  North: 0,
  East: 1,
  South: 2,
  West: 3,
} as const;
export type CardinalDirection = (typeof CardinalDirection)[keyof typeof CardinalDirection];

export const DiagonalDirection = {
  NorthEast: 4,
  SouthEast: 5,
  SouthWest: 6,
  NorthWest: 7,
} as const;
export type DiagonalDirection = (typeof DiagonalDirection)[keyof typeof DiagonalDirection];

export function* cardinalDirections(): Generator<CardinalDirection> {
  for (let i = 0; i < 4; i++) {
    yield i as CardinalDirection;
  }
}

export function* diagonalDirections(): Generator<DiagonalDirection> {
  for (let i = 4; i < 8; i++) {
    yield i as DiagonalDirection;
  }
}

export type GridDirection = CardinalDirection | DiagonalDirection;

export function* gridDirections(): Generator<GridDirection> {
  for (let i = 0; i < 8; i++) {
    yield i as GridDirection;
  }
}

export function isCardinalDirection(direction: GridDirection): direction is CardinalDirection {
  return direction < 4;
}

export function isDiagonalDiection(direction: GridDirection): direction is DiagonalDirection {
  return direction >= 4;
}

export type GridNeighborEntry<T extends GridDirection> = readonly [
  direction: T,
  vector: GridVector2D,
];

export class GridVector2D implements GridVector2DRecord {
  static readonly ORIGIN = new GridVector2D(0, 0);

  static fromRecord({ q, r }: GridVector2DRecord): GridVector2D {
    return new GridVector2D(q, r);
  }

  static fromTuple([q, r]: GridVector2DTuple): GridVector2D {
    return new GridVector2D(q, r);
  }

  readonly q: number;
  readonly r: number;

  constructor(q: number, r: number) {
    this.q = q;
    this.r = r;
  }

  scale(value: number): GridVector2D {
    return new GridVector2D(this.q * value, this.r * value);
  }

  add({ q, r }: GridVector2DRecord): GridVector2D {
    return new GridVector2D(this.q + q, this.r + r);
  }

  equals({ q, r }: GridVector2DRecord): boolean {
    return this.q === q && this.r === r;
  }

  distance({ q, r }: GridVector2DRecord): number {
    return Math.abs(q - this.q) + Math.abs(r - this.r);
  }

  neighbor(direction: GridDirection): GridVector2D {
    return this.add(toGridDelta(direction));
  }

  north(): GridVector2D {
    return this.neighbor(CardinalDirection.North);
  }

  east(): GridVector2D {
    return this.neighbor(CardinalDirection.East);
  }

  south(): GridVector2D {
    return this.neighbor(CardinalDirection.South);
  }

  west(): GridVector2D {
    return this.neighbor(CardinalDirection.West);
  }

  northEast(): GridVector2D {
    return this.neighbor(DiagonalDirection.NorthEast);
  }

  southEast(): GridVector2D {
    return this.neighbor(DiagonalDirection.SouthEast);
  }

  southWest(): GridVector2D {
    return this.neighbor(DiagonalDirection.SouthWest);
  }

  northWest(): GridVector2D {
    return this.neighbor(DiagonalDirection.NorthWest);
  }

  *neighbors(): Generator<GridNeighborEntry<CardinalDirection>> {
    yield [CardinalDirection.North, this.north()];
    yield [CardinalDirection.East, this.east()];
    yield [CardinalDirection.South, this.south()];
    yield [CardinalDirection.West, this.west()];
  }

  *diagonals(): Generator<GridNeighborEntry<DiagonalDirection>> {
    yield [DiagonalDirection.NorthEast, this.northEast()];
    yield [DiagonalDirection.SouthEast, this.southEast()];
    yield [DiagonalDirection.SouthWest, this.southWest()];
    yield [DiagonalDirection.NorthWest, this.northWest()];
  }

  *allNeighbors(): Generator<GridNeighborEntry<GridDirection>> {
    yield [CardinalDirection.North, this.north()];
    yield [DiagonalDirection.NorthEast, this.northEast()];
    yield [CardinalDirection.East, this.east()];
    yield [DiagonalDirection.SouthEast, this.southEast()];
    yield [CardinalDirection.South, this.south()];
    yield [DiagonalDirection.SouthWest, this.southWest()];
    yield [CardinalDirection.West, this.west()];
    yield [DiagonalDirection.NorthWest, this.northWest()];
  }
}

const DELTAS: ReadonlyArray<GridVector2D> = [
  new GridVector2D(0, -1),
  new GridVector2D(1, 0),
  new GridVector2D(0, 1),
  new GridVector2D(-1, 0),
  new GridVector2D(1, -1),
  new GridVector2D(1, 1),
  new GridVector2D(-1, 1),
  new GridVector2D(-1, -1),
];

export function toGridDelta(direction: GridDirection): GridVector2D {
  return DELTAS[direction];
}

export function toGridDirection(delta: GridVector2DRecord): GridDirection {
  const index = DELTAS.findIndex((d) => d.equals(delta));
  if (index === -1) {
    throw new Error("Invalid delta");
  }
  return index as GridDirection;
}

export class GridBounds2D implements GridVector2DCodec, Iterable<GridVector2D> {
  readonly min: GridVector2D;
  readonly max: GridVector2D;

  static fromOrigin(dimensions: GridVector2DRecord): GridBounds2D {
    return new GridBounds2D(GridVector2D.ORIGIN, dimensions);
  }

  static inclusive(a: GridVector2DRecord, b: GridVector2DRecord): GridBounds2D {
    const min = new GridVector2D(Math.min(a.q, b.q), Math.min(a.r, b.r));
    const max = new GridVector2D(Math.max(a.q, b.q) + 1, Math.max(a.r, b.r) + 1);
    return new GridBounds2D(min, max);
  }

  constructor(a: GridVector2DRecord, b: GridVector2DRecord) {
    this.min = new GridVector2D(Math.min(a.q, b.q), Math.min(a.r, b.r));
    this.max = new GridVector2D(Math.max(a.q, b.q), Math.max(a.r, b.r));
  }

  get cols(): number {
    return this.max.q - this.min.q;
  }

  get rows(): number {
    return this.max.r - this.min.r;
  }

  get area(): number {
    return this.cols * this.rows;
  }

  assert(vector: GridVector2DRecord): void {
    if (!this.includes(vector)) {
      throw new Error("Out of bounds");
    }
  }

  includes({ q, r }: GridVector2DRecord): boolean {
    return q >= this.min.q && q < this.max.q && r >= this.min.r && r < this.max.r;
  }

  toLocal({ q, r }: GridVector2DRecord): GridVector2D {
    return new GridVector2D(q - this.min.q, r - this.min.r);
  }

  toGlobal({ q, r }: GridVector2DRecord): GridVector2D {
    return new GridVector2D(q + this.min.q, r + this.min.r);
  }

  toId(vector: GridVector2DRecord): number {
    this.assert(vector);
    const { cols } = this;
    const { q, r } = this.toLocal(vector);
    return r * cols + q;
  }

  fromId(id: number): GridVector2D {
    const { cols } = this;
    const q = id % cols;
    const r = Math.floor(id / cols);
    const result = this.toGlobal({ q, r });
    this.assert(result);
    return result;
  }

  *[Symbol.iterator](): Generator<GridVector2D> {
    for (let r = this.min.r; r < this.max.r; r++) {
      for (let q = this.min.q; q < this.max.q; q++) {
        yield new GridVector2D(q, r);
      }
    }
  }

  values(): Generator<GridVector2D> {
    return this[Symbol.iterator]();
  }

  equals(bounds: GridBounds2D): boolean {
    return this.min.equals(bounds.min) && this.max.equals(bounds.max);
  }

  translate(delta: GridVector2DRecord): GridBounds2D {
    return new GridBounds2D(this.min.add(delta), this.max.add(delta));
  }
}

export type MatrixGridEntry<T> = readonly [vector: GridVector2D, value: T];

export class MatrixGrid<T> implements Iterable<MatrixGridEntry<T>> {
  readonly matrix: ReadonlyArray<ReadonlyArray<T>>;
  readonly bounds: GridBounds2D;

  constructor(matrix: ReadonlyArray<ReadonlyArray<T>>) {
    this.matrix = matrix;
    this.bounds = GridBounds2D.fromOrigin({
      q: matrix[0].length,
      r: matrix.length,
    });
  }

  at(vector: GridVector2DRecord): T {
    this.bounds.assert(vector);
    return this.matrix[vector.r][vector.q];
  }

  keys(): Generator<GridVector2D> {
    return this.bounds[Symbol.iterator]();
  }

  *values(): Generator<T> {
    for (const key of this.keys()) {
      yield this.at(key);
    }
  }

  *[Symbol.iterator](): Generator<MatrixGridEntry<T>> {
    for (const vector of this.keys()) {
      yield [vector, this.at(vector)];
    }
  }

  entries(): Generator<MatrixGridEntry<T>> {
    return this[Symbol.iterator]();
  }
}

export interface GridVector2DCodec {
  toId(vector: GridVector2DRecord): number;
  fromId(id: number): GridVector2D;
}

export const InfiniteGrid2DCodec: GridVector2DCodec = {
  toId({ q, r }) {
    return toCantor(toZigZag(q), toZigZag(r));
  },
  fromId(id) {
    return GridVector2D.fromTuple(
      fromCantor(id).map((value) => fromZigZag(value)) as unknown as GridVector2DTuple,
    );
  },
};

export class GridVector2DSet implements Set<GridVector2D> {
  readonly #codec: GridVector2DCodec;
  readonly #data: Set<number>;

  constructor(codec: GridVector2DCodec, iterable?: Iterable<GridVector2D>) {
    this.#codec = codec;
    this.#data = new Set();
    if (iterable) {
      for (const vector of iterable) {
        this.add(vector);
      }
    }
  }

  add(vector: GridVector2D): this {
    this.#data.add(this.#codec.toId(vector));
    return this;
  }

  clear(): void {
    this.#data.clear();
  }

  delete(vector: GridVector2D): boolean {
    return this.#data.delete(this.#codec.toId(vector));
  }

  forEach(
    callbackfn: (value: GridVector2D, value2: GridVector2D, set: Set<GridVector2D>) => void,
    thisArg?: any,
  ): void {
    for (const vector of this) {
      callbackfn.call(thisArg, vector, vector, this);
    }
  }

  has(vector: GridVector2D): boolean {
    return this.#data.has(this.#codec.toId(vector));
  }

  get size(): number {
    return this.#data.size;
  }

  *entries(): SetIterator<[GridVector2D, GridVector2D]> {
    for (const vector of this) {
      yield [vector, vector];
    }
  }

  keys(): SetIterator<GridVector2D> {
    return this[Symbol.iterator]();
  }

  values(): SetIterator<GridVector2D> {
    return this[Symbol.iterator]();
  }

  *[Symbol.iterator](): SetIterator<GridVector2D> {
    for (const id of this.#data) {
      yield this.#codec.fromId(id);
    }
  }

  get [Symbol.toStringTag](): string {
    return this.#data[Symbol.toStringTag];
  }

  union<U>(_: ReadonlySetLike<U>): Set<GridVector2D | U> {
    throw new Error("Method not implemented.");
  }

  intersection<U>(_: ReadonlySetLike<U>): Set<GridVector2D & U> {
    throw new Error("Method not implemented.");
  }

  difference<U>(_: ReadonlySetLike<U>): Set<GridVector2D> {
    throw new Error("Method not implemented.");
  }

  symmetricDifference<U>(_: ReadonlySetLike<U>): Set<GridVector2D | U> {
    throw new Error("Method not implemented.");
  }

  isSubsetOf(_: ReadonlySetLike<unknown>): boolean {
    throw new Error("Method not implemented.");
  }

  isSupersetOf(_: ReadonlySetLike<unknown>): boolean {
    throw new Error("Method not implemented.");
  }

  isDisjointFrom(_: ReadonlySetLike<unknown>): boolean {
    throw new Error("Method not implemented.");
  }
}

export class GridVector2DMap<T> implements Map<GridVector2D, T> {
  readonly #codec: GridVector2DCodec;
  readonly #data: Map<number, T>;

  constructor(codec: GridVector2DCodec, entries?: Iterable<readonly [GridVector2D, T]>) {
    this.#codec = codec;
    this.#data = new Map();
    if (entries) {
      for (const [key, value] of entries) {
        this.set(key, value);
      }
    }
  }

  clear(): void {
    this.#data.clear();
  }

  delete(key: GridVector2D): boolean {
    return this.#data.delete(this.#codec.toId(key));
  }

  forEach(_: (value: T, key: GridVector2D, map: Map<GridVector2D, T>) => void, __?: any): void {
    throw new Error("Method not implemented.");
  }

  get(key: GridVector2D): T | undefined {
    return this.#data.get(this.#codec.toId(key));
  }

  has(key: GridVector2D): boolean {
    return this.#data.has(this.#codec.toId(key));
  }

  set(key: GridVector2D, value: T): this {
    this.#data.set(this.#codec.toId(key), value);
    return this;
  }

  get size(): number {
    return this.#data.size;
  }

  entries(): MapIterator<[GridVector2D, T]> {
    return this[Symbol.iterator]();
  }

  *keys(): MapIterator<GridVector2D> {
    for (const id of this.#data.keys()) {
      yield this.#codec.fromId(id);
    }
  }

  values(): MapIterator<T> {
    return this.#data.values();
  }

  *[Symbol.iterator](): MapIterator<[GridVector2D, T]> {
    for (const [id, value] of this.#data) {
      yield [this.#codec.fromId(id), value];
    }
  }

  get [Symbol.toStringTag](): string {
    return this.#data[Symbol.toStringTag];
  }
}
