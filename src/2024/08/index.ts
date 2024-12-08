import {
    GridBounds2D,
    GridVector2D,
    GridVector2DSet,
} from "../../common/grid2d";
import { main } from "../../utils/host";

type Antenna = string;
type FrequencyMap = ReadonlyMap<Antenna, ReadonlyArray<GridVector2D>>;

interface City {
    readonly bounds: GridBounds2D;
    readonly frequencies: FrequencyMap;
}

const parse = (input: string): City => {
    const grid = input
        .trim()
        .split("\n")
        .map((line) => line.trim().split(""));
    const bounds = GridBounds2D.fromOrigin({
        q: grid[0].length,
        r: grid.length,
    });
    const frequencies = new Map<Antenna, GridVector2D[]>();
    for (let r = 0; r < grid.length; r++) {
        for (let q = 0; q < grid[r].length; q++) {
            const cell = grid[r][q];
            if (cell === ".") {
                continue;
            }
            if (!frequencies.has(cell)) {
                frequencies.set(cell, []);
            }
            frequencies.get(cell)!.push(new GridVector2D(q, r));
        }
    }
    return { bounds, frequencies };
};

function* pairs<T>(items: ReadonlyArray<T>): Generator<readonly [T, T]> {
    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            yield [items[i], items[j]];
        }
    }
}

function* walk(
    bounds: GridBounds2D,
    curr: GridVector2D,
    delta: GridVector2D,
): Generator<GridVector2D> {
    while (bounds.includes(curr)) {
        yield curr;
        curr = curr.add(delta);
    }
}

const part1 = ({ bounds, frequencies }: City): number => {
    const antinodes = new GridVector2DSet(bounds);
    for (const positions of frequencies.values()) {
        for (const [a, b] of pairs(positions)) {
            const delta = new GridVector2D(a.q - b.q, a.r - b.r);
            const da = a.add(delta);
            const db = b.add(delta.scale(-1));
            if (bounds.includes(da)) {
                antinodes.add(da);
            }
            if (bounds.includes(db)) {
                antinodes.add(db);
            }
        }
    }
    return antinodes.size;
};

const part2 = ({ bounds, frequencies }: City): number => {
    const antinodes = new GridVector2DSet(bounds);
    for (const positions of frequencies.values()) {
        for (const [a, b] of pairs(positions)) {
            const delta = new GridVector2D(a.q - b.q, a.r - b.r);
            for (const da of walk(bounds, a, delta)) {
                antinodes.add(da);
            }
            for (const db of walk(bounds, b, delta.scale(-1))) {
                antinodes.add(db);
            }
        }
    }
    return antinodes.size;
};

main(module, parse, part1, part2);
