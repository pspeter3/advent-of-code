import { main } from "../../utils/host.ts";

class Tile {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    get id(): number {
        const { x, y } = this;
        return 0.5 * (x + y) * (x + y + 1) + y;
    }

    distance({ x, y }: Tile) {
        return Math.abs(this.x - x) + Math.abs(this.y - y);
    }
}

const toInt = (value: string): number => {
    const result = parseInt(value, 10);
    if (Number.isNaN(result)) {
        throw new Error(`Invalid number: ${value}`);
    }
    return result;
};

const parse = (input: string): ReadonlyMap<Tile, number> =>
    new Map(
        input
            .trim()
            .split("\n")
            .map((line) => {
                const match = line.match(
                    /^Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)$/,
                );
                if (match === null) {
                    throw new Error(`Invalid line: ${line}`);
                }
                const [sx, sy, bx, by] = match
                    .slice(1)
                    .map((value) => toInt(value));
                const sensor = new Tile(sx, sy);
                return [sensor, sensor.distance(new Tile(bx, by))];
            }),
    );

const part1 = (sensors: ReadonlyMap<Tile, number>): number => {
    const y = sensors.size === 14 ? 10 : 2000000;
    const covered = new Set<number>();
    for (const [sensor, distance] of sensors) {
        const delta = distance - Math.abs(sensor.y - y);
        if (delta < 0) {
            continue;
        }
        const start = sensor.x - delta;
        const end = sensor.x + delta;
        for (let x = start; x <= end; x++) {
            covered.add(x);
        }
    }
    return covered.size - 1;
};

const part2 = (sensors: ReadonlyMap<Tile, number>): number => {
    const max = sensors.size === 14 ? 20 : 4000000;
    const inBounds = (tile: Tile): boolean =>
        tile.x >= 0 && tile.x <= max && tile.y >= 0 && tile.y <= max;
    const isValid = (tile: Tile): boolean => {
        for (const [sensor, distance] of sensors) {
            if (sensor.distance(tile) <= distance) {
                return false;
            }
        }
        return true;
    };
    const signs = [-1, 1] as const;
    for (const [sensor, distance] of sensors) {
        const border = distance + 1;
        for (const sx of signs) {
            for (const sy of signs) {
                for (let dx = 0; dx <= border; dx++) {
                    const dy = border - dx;
                    const tile = new Tile(
                        sensor.x + sx * dx,
                        sensor.y + sy * dy,
                    );
                    if (!inBounds(tile)) {
                        continue;
                    }
                    if (isValid(tile)) {
                        return 4000000 * tile.x + tile.y;
                    }
                }
            }
        }
    }
    return 0;
};

await main(import.meta, parse, part1, part2);
