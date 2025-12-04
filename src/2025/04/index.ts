import {
    GridBounds2D,
    GridVector2D,
    GridVector2DSet,
} from "../../common/grid2d.ts";
import { len } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

interface Problem {
    readonly bounds: GridBounds2D;
    readonly rolls: GridVector2DSet;
}

const parse = (input: string): Problem => {
    const lines = input.trim().split("\n");
    const bounds = GridBounds2D.fromOrigin({
        q: lines[0].length,
        r: lines.length,
    });
    const rolls = new GridVector2DSet(bounds);
    for (const [r, line] of lines.entries()) {
        for (const [q, char] of line.split("").entries()) {
            if (char !== "@") {
                continue;
            }
            rolls.add(new GridVector2D(q, r));
        }
    }
    return { bounds, rolls };
};

const canReach = (
    bounds: GridBounds2D,
    rolls: GridVector2DSet,
    roll: GridVector2D,
): boolean =>
    len(
        roll
            .allNeighbors()
            .filter(([_, n]) => bounds.includes(n) && rolls.has(n)),
    ) < 4;

const removeRolls = (
    bounds: GridBounds2D,
    rolls: GridVector2DSet,
): GridVector2DSet =>
    new GridVector2DSet(
        bounds,
        rolls.values().filter((roll) => canReach(bounds, rolls, roll)),
    );

const part1 = ({ bounds, rolls }: Problem): number =>
    removeRolls(bounds, rolls).size;

const part2 = ({ bounds, rolls }: Problem): number => {
    let total = 0;
    let current = new GridVector2DSet(bounds, rolls);
    while (true) {
        const removed = removeRolls(bounds, current);
        if (removed.size === 0) {
            break;
        }
        total += removed.size;
        for (const roll of removed) {
            current.delete(roll);
        }
    }
    return total;
};

await main(import.meta, parse, part1, part2);
