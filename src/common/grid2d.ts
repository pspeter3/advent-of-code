import { map } from "./itertools";

export interface GridVector2DRecord {
    readonly q: number;
    readonly r: number;
}

export type GridVector2DTuple = readonly [q: number, r: number];

export enum CardinalDirection {
    North = 0,
    East = 1,
    South = 2,
    West = 3,
}

export enum DiagonalDirection {
    NorthEast = 4,
    SouthEast = 5,
    SouthWest = 6,
    NorthWest = 7,
}

export function* cardinalDirections(): Iterable<CardinalDirection> {
    for (let i = 0; i < 4; i++) {
        yield i;
    }
}

export type GridDirection = CardinalDirection | DiagonalDirection;

const DELTAS: ReadonlyArray<GridVector2DRecord> = [
    { q: 0, r: -1 },
    { q: 1, r: 0 },
    { q: 0, r: 1 },
    { q: -1, r: 0 },
    { q: 1, r: -1 },
    { q: 1, r: 1 },
    { q: 1, r: 1 },
    { q: -1, r: -1 },
];

export function toGridDelta(direction: GridDirection): GridVector2DRecord {
    return DELTAS[direction];
}

export function toGridDirection(delta: GridVector2DRecord): GridDirection {
    const index = DELTAS.findIndex(
        ({ q, r }) => q === delta.q && r === delta.r,
    );
    if (index === -1) {
        throw new Error("Invalid delta");
    }
    return index;
}

export function isCardinalDirection(
    direction: GridDirection,
): direction is CardinalDirection {
    return direction < 4;
}

export function isDiagonalDiection(
    direction: GridDirection,
): direction is DiagonalDirection {
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

    *neighbors(): Iterable<GridNeighborEntry<CardinalDirection>> {
        yield [CardinalDirection.North, this.north()];
        yield [CardinalDirection.East, this.east()];
        yield [CardinalDirection.South, this.south()];
        yield [CardinalDirection.West, this.west()];
    }

    *diagonals(): Iterable<GridNeighborEntry<DiagonalDirection>> {
        yield [DiagonalDirection.NorthEast, this.northEast()];
        yield [DiagonalDirection.SouthEast, this.southEast()];
        yield [DiagonalDirection.SouthWest, this.southWest()];
        yield [DiagonalDirection.NorthWest, this.northWest()];
    }
}

export class GridBounds2D implements Iterable<GridVector2D> {
    readonly min: GridVector2D;
    readonly max: GridVector2D;

    static fromOrigin(dimensions: GridVector2DRecord): GridBounds2D {
        return new GridBounds2D(GridVector2D.ORIGIN, dimensions);
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

    assert(vector: GridVector2DRecord): void {
        if (!this.contains(vector)) {
            throw new Error("Out of bounds");
        }
    }

    contains({ q, r }: GridVector2DRecord): boolean {
        return (
            q >= this.min.q &&
            q < this.max.q &&
            r >= this.min.r &&
            r < this.max.r
        );
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

    *[Symbol.iterator](): IterableIterator<GridVector2D> {
        for (let q = this.min.q; q < this.max.q; q++) {
            for (let r = this.min.r; r < this.max.r; r++) {
                yield new GridVector2D(q, r);
            }
        }
    }

    equals(bounds: GridBounds2D): boolean {
        return this.min.equals(bounds.min) && this.max.equals(bounds.max);
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

    keys(): Iterable<GridVector2D> {
        return this.bounds[Symbol.iterator]();
    }

    values(): Iterable<T> {
        return map(this.keys(), (vector) => this.at(vector));
    }

    *[Symbol.iterator](): IterableIterator<MatrixGridEntry<T>> {
        for (const vector of this.keys()) {
            yield [vector, this.at(vector)];
        }
    }
}
