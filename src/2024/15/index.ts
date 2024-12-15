import { dir } from "node:console";
import {
    CardinalDirection,
    GridBounds2D,
    GridVector2D,
    GridVector2DSet,
} from "../../common/grid2d";
import { sum } from "../../common/itertools";
import { main } from "../../utils/host";

interface Warehouse {
    readonly bounds: GridBounds2D;
    readonly walls: ReadonlySet<GridVector2D>;
    readonly boxes: ReadonlySet<GridVector2D>;
    readonly robot: GridVector2D;
    readonly moves: ReadonlyArray<CardinalDirection>;
}

const MOVES = ["^", ">", "v", "<"] as const;

const parse = (input: string): Warehouse => {
    const chunks = input.split("\n\n");
    if (chunks.length !== 2) {
        throw new Error("Invalid input");
    }
    const matrix = chunks[0].split("\n").map((line) => line.split(""));
    const bounds = GridBounds2D.fromOrigin({
        q: matrix[0].length,
        r: matrix.length,
    });
    const walls = new GridVector2DSet(bounds);
    const boxes = new GridVector2DSet(bounds);
    let robot: GridVector2D | undefined;
    for (let r = 0; r < matrix.length; r++) {
        for (let q = 0; q < matrix[r].length; q++) {
            const cell = new GridVector2D(q, r);
            switch (matrix[r][q]) {
                case "#":
                    walls.add(cell);
                    break;
                case "O":
                    boxes.add(cell);
                    break;
                case "@":
                    robot = cell;
                    break;
            }
        }
    }
    if (robot === undefined) {
        throw new Error("Robot not found");
    }
    const moves = chunks[1].split("\n").flatMap((line) =>
        line
            .trim()
            .split("")
            .map((char) =>
                MOVES.indexOf(char as unknown as (typeof MOVES)[number]),
            ),
    );

    return { bounds, walls, boxes, robot, moves };
};

const walk = (
    warehouse: Warehouse,
    direction: CardinalDirection,
): ReadonlyArray<GridVector2D> | null => {
    const path: GridVector2D[] = [];
    let current = warehouse.robot.neighbor(direction);
    while (warehouse.bounds.includes(current)) {
        path.push(current);
        if (warehouse.walls.has(current)) {
            return null;
        }
        if (!warehouse.boxes.has(current)) {
            return path;
        }
        current = current.neighbor(direction);
    }
    throw new Error("Invalid warehouse state");
};

class WideWarehouse {
    readonly bounds: GridBounds2D;
    readonly walls: ReadonlySet<GridVector2D>;
    readonly boxes: GridVector2DSet;
    robot: GridVector2D;

    constructor(warehouse: Warehouse) {
        this.bounds = GridBounds2D.fromOrigin({
            q: warehouse.bounds.max.q * 2,
            r: warehouse.bounds.max.r,
        });
        const walls = new GridVector2DSet(this.bounds);
        for (const wall of warehouse.walls) {
            walls.add(new GridVector2D(wall.q * 2, wall.r));
            walls.add(new GridVector2D(wall.q * 2 + 1, wall.r));
        }
        this.walls = walls;
        const boxes = new GridVector2DSet(this.bounds);
        for (const box of warehouse.boxes) {
            boxes.add(new GridVector2D(box.q * 2, box.r));
        }
        this.boxes = boxes;
        this.robot = new GridVector2D(warehouse.robot.q * 2, warehouse.robot.r);
    }

    move(direction: CardinalDirection): void {
        const next = this.robot.neighbor(direction);
        if (this.walls.has(next)) {
            return;
        }
        if (this.#toBox(next) === null) {
            this.robot = next;
            return;
        }
        const boxes =
            direction % 2 === 1
                ? this.#moveHorizontal(next, direction)
                : this.#moveVertical(next, direction);
        for (const box of boxes) {
            this.boxes.delete(box);
        }
        for (const box of boxes) {
            this.boxes.add(box.neighbor(direction));
        }
        if (boxes.size > 0) {
            this.robot = next;
        }
    }

    #moveHorizontal(
        start: GridVector2D,
        direction: CardinalDirection,
    ): ReadonlySet<GridVector2D> {
        let current = start;
        const boxes = new GridVector2DSet(this.bounds);
        while (this.bounds.includes(current)) {
            if (this.walls.has(current)) {
                return new Set();
            }
            const box = this.#toBox(current);
            if (box === null) {
                return boxes;
            }
            current = current.neighbor(direction);
            boxes.add(box);
        }
        throw new Error("Invalid warehouse state");
    }

    #moveVertical(
        start: GridVector2D,
        direction: CardinalDirection,
    ): ReadonlySet<GridVector2D> {
        const b = this.#toBox(start);
        if (b === null) {
            throw new Error("Invalid box");
        }
        const boxes = new GridVector2DSet(this.bounds);
        boxes.add(b);
        for (const box of boxes) {
            for (const cell of [box, box.neighbor(CardinalDirection.East)]) {
                const next = cell.neighbor(direction);
                if (this.walls.has(next)) {
                    return new Set();
                }
                const b = this.#toBox(next);
                if (b !== null) {
                    boxes.add(b);
                }
            }
        }
        return boxes;
    }

    #toBox(cell: GridVector2D): GridVector2D | null {
        if (this.boxes.has(cell)) {
            return cell;
        }
        const left = cell.neighbor(CardinalDirection.West);
        if (this.boxes.has(left)) {
            return left;
        }
        return null;
    }

    toString(): string {
        const lines: string[] = [];
        for (let r = 0; r < this.bounds.max.r; r++) {
            const line: string[] = [];
            for (let q = 0; q < this.bounds.max.q; q++) {
                const cell = new GridVector2D(q, r);
                if (this.robot.equals(cell)) {
                    line.push("@");
                    continue;
                }
                if (this.walls.has(cell)) {
                    line.push("#");
                    continue;
                }
                const box = this.#toBox(cell);
                if (box === null) {
                    line.push(".");
                    continue;
                }
                line.push(box.equals(cell) ? "[" : "]");
            }
            lines.push(line.join(""));
        }
        return lines.join("\n");
    }
}

const sumGPS = (boxes: ReadonlySet<GridVector2D>): number =>
    sum(boxes.values().map((box) => 100 * box.r + box.q));

const part1 = (warehouse: Warehouse): number => {
    let robot = warehouse.robot;
    const boxes = new GridVector2DSet(warehouse.bounds);
    for (const box of warehouse.boxes) {
        boxes.add(box);
    }
    for (const move of warehouse.moves) {
        const path = walk({ ...warehouse, boxes, robot }, move);
        if (path === null) {
            continue;
        }
        robot = robot.neighbor(move);
        if (path.length > 1) {
            boxes.add(path.at(-1)!);
            boxes.delete(path.at(0)!);
        }
    }
    return sumGPS(boxes);
};

const part2 = (input: Warehouse): number => {
    const warehouse = new WideWarehouse(input);
    const { moves } = input;
    for (const move of moves) {
        warehouse.move(move);
    }
    return sumGPS(warehouse.boxes);
};

main(module, parse, part1, part2);
