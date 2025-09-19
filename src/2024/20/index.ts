import {
    GridBounds2D,
    GridVector2D,
    GridVector2DMap,
    GridVector2DSet,
} from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";

interface RaceTrack {
    readonly bounds: GridBounds2D;
    readonly path: ReadonlyMap<GridVector2D, number>;
}

const findCheats = (
    { bounds, path }: RaceTrack,
    radius: number,
    threshold: number,
): number => {
    let count = 0;
    const tl = new GridVector2D(-radius, -radius);
    const br = new GridVector2D(radius + 1, radius + 1);
    for (const [tile, cost] of path) {
        for (const v of new GridBounds2D(tile.add(tl), tile.add(br))) {
            if (!bounds.includes(v)) {
                continue;
            }
            const distance = tile.distance(v);
            if (distance > radius || !path.has(v)) {
                continue;
            }
            const delta = path.get(v)! - cost - distance;
            if (delta >= threshold) {
                count++;
            }
        }
    }
    return count;
};

const parse = (input: string): RaceTrack => {
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
    console.log(start, end);
    const path = new GridVector2DMap(bounds, [[start, 0]]);
    for (const [tile, cost] of path) {
        if (tile.equals(end)) {
            break;
        }
        const neighbors = tile
            .neighbors()
            .map(([_, n]) => n)
            .filter((n) => bounds.includes(n) && !walls.has(n) && !path.has(n))
            .toArray();
        if (neighbors.length !== 1) {
            throw new Error("Invalid path");
        }
        path.set(neighbors[0], cost + 1);
    }
    return { bounds, path };
};

const part1 = (track: RaceTrack): number =>
    findCheats(track, 2, track.path.size === 85 ? 20 : 100);

const part2 = (track: RaceTrack): number =>
    findCheats(track, 20, track.path.size === 85 ? 76 : 100);

main(module, parse, part1, part2);
