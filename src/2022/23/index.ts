import { main } from "../../utils/host.ts";

const Direction = { North: 0, South: 1, West: 2, East: 3 } as const;
type Direction = (typeof Direction)[keyof typeof Direction];
const DIRECTIONS = 4;

const zigZag = (value: number): bigint => {
    const result = 2 * value;
    return value < 0 ? BigInt(Math.abs(result) - 1) : BigInt(result);
};

class GridTile {
    readonly q: number;
    readonly r: number;

    constructor(q: number, r: number) {
        this.q = q;
        this.r = r;
    }

    get id(): bigint {
        const { q, r } = this;
        const x = zigZag(q);
        const y = zigZag(r);
        return (x * x + x + 2n * x * y + 3n * y + y * y) / 2n;
    }

    north(): GridTile {
        return new GridTile(this.q, this.r - 1);
    }

    northEast(): GridTile {
        return new GridTile(this.q + 1, this.r - 1);
    }

    east(): GridTile {
        return new GridTile(this.q + 1, this.r);
    }

    southEast(): GridTile {
        return new GridTile(this.q + 1, this.r + 1);
    }

    south(): GridTile {
        return new GridTile(this.q, this.r + 1);
    }

    southWest(): GridTile {
        return new GridTile(this.q - 1, this.r + 1);
    }

    west(): GridTile {
        return new GridTile(this.q - 1, this.r);
    }

    northWest(): GridTile {
        return new GridTile(this.q - 1, this.r - 1);
    }

    *neighbors(): IterableIterator<GridTile> {
        yield this.north();
        yield this.northEast();
        yield this.east();
        yield this.southEast();
        yield this.south();
        yield this.southWest();
        yield this.west();
        yield this.northWest();
    }

    *northern(): IterableIterator<GridTile> {
        yield this.northWest();
        yield this.north();
        yield this.northEast();
    }

    *eastern(): IterableIterator<GridTile> {
        yield this.northEast();
        yield this.east();
        yield this.southEast();
    }

    *southern(): IterableIterator<GridTile> {
        yield this.southEast();
        yield this.south();
        yield this.southWest();
    }

    *western(): IterableIterator<GridTile> {
        yield this.southWest();
        yield this.west();
        yield this.northWest();
    }

    adjacent(direction: Direction): IterableIterator<GridTile> {
        switch (direction) {
            case Direction.North: {
                return this.northern();
            }
            case Direction.East: {
                return this.eastern();
            }
            case Direction.South: {
                return this.southern();
            }
            case Direction.West: {
                return this.western();
            }
        }
    }

    move(direction: Direction): GridTile {
        switch (direction) {
            case Direction.North: {
                return this.north();
            }
            case Direction.East: {
                return this.east();
            }
            case Direction.South: {
                return this.south();
            }
            case Direction.West: {
                return this.west();
            }
        }
    }
}

interface ProposedMove {
    source: GridTile;
    target: GridTile;
}

const propose = (
    ids: ReadonlySet<BigInt>,
    elf: GridTile,
    direction: Direction,
): ProposedMove | null => {
    for (let i = 0; i < DIRECTIONS; i++) {
        const d = ((direction + i) % DIRECTIONS) as Direction;
        if (Array.from(elf.adjacent(d)).every(({ id }) => !ids.has(id))) {
            return { source: elf, target: elf.move(d) };
        }
    }
    return null;
};

function* gridTiles(input: string): IterableIterator<GridTile> {
    for (const [r, line] of input.split("\n").entries()) {
        for (const [q, char] of Array.from(line).entries()) {
            if (char === "#") {
                yield new GridTile(q, r);
            }
        }
    }
}

const parse = (input: string): ReadonlyArray<GridTile> =>
    Array.from(gridTiles(input));

const part1 = (elves: ReadonlyArray<GridTile>): number => {
    let current = elves;
    for (let i = 0; i < 10; i++) {
        const direction = (i % DIRECTIONS) as Direction;
        const ids = new Set(current.map(({ id }) => id));
        const proposed = new Map<bigint, ProposedMove[]>();
        const next: GridTile[] = [];
        for (const elf of current) {
            let hasNeighbor = false;
            for (const n of elf.neighbors()) {
                if (ids.has(n.id)) {
                    hasNeighbor = true;
                    break;
                }
            }
            if (!hasNeighbor) {
                next.push(elf);
                continue;
            }
            const proposal = propose(ids, elf, direction);
            if (proposal === null) {
                next.push(elf);
                continue;
            }
            const key = proposal.target.id;
            if (!proposed.has(key)) {
                proposed.set(key, []);
            }
            proposed.get(key)!.push(proposal);
        }
        for (const proposals of proposed.values()) {
            if (proposals.length === 1) {
                next.push(proposals[0].target);
            } else {
                for (const { source } of proposals) {
                    next.push(source);
                }
            }
        }
        current = next;
    }
    const ids = new Set<bigint>();
    let minQ = Infinity;
    let maxQ = -Infinity;
    let minR = Infinity;
    let maxR = -Infinity;
    for (const { q, r, id } of current) {
        ids.add(id);
        minQ = Math.min(minQ, q);
        maxQ = Math.max(maxQ, q);
        minR = Math.min(minR, r);
        maxR = Math.max(maxR, r);
    }
    let count = 0;
    for (let q = minQ; q <= maxQ; q++) {
        for (let r = minR; r <= maxR; r++) {
            if (!ids.has(new GridTile(q, r).id)) {
                count++;
            }
        }
    }
    return count;
};

const part2 = (elves: ReadonlyArray<GridTile>): number => {
    let current = elves;
    let count = 0;
    while (true) {
        let moved = false;
        const direction = (count % DIRECTIONS) as Direction;
        const ids = new Set(current.map(({ id }) => id));
        const proposed = new Map<bigint, ProposedMove[]>();
        const next: GridTile[] = [];
        count++;
        for (const elf of current) {
            let hasNeighbor = false;
            for (const n of elf.neighbors()) {
                if (ids.has(n.id)) {
                    hasNeighbor = true;
                    break;
                }
            }
            if (!hasNeighbor) {
                next.push(elf);
                continue;
            }
            const proposal = propose(ids, elf, direction);
            if (proposal === null) {
                next.push(elf);
                continue;
            }
            const key = proposal.target.id;
            if (!proposed.has(key)) {
                proposed.set(key, []);
            }
            proposed.get(key)!.push(proposal);
        }
        for (const proposals of proposed.values()) {
            if (proposals.length === 1) {
                moved = true;
                next.push(proposals[0].target);
            } else {
                for (const { source } of proposals) {
                    next.push(source);
                }
            }
        }
        if (!moved) {
            break;
        }
        current = next;
    }
    return count;
};

await main(import.meta, parse, part1, part2);
