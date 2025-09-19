import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema, StringSchema } from "../../utils/schemas.ts";

const Pixel = { Dark: ".", Light: "#" } as const;
type Pixel = (typeof Pixel)[keyof typeof Pixel];

const Bits: Readonly<Record<Pixel, 0 | 1>> = {
    [Pixel.Dark]: 0,
    [Pixel.Light]: 1,
};

const PixelListSchema = z.preprocess(
    (line) => StringSchema.parse(line).trim().split(""),
    z.array(z.enum(Pixel)),
);

const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split("\n\n"),
    z.tuple([PixelListSchema, LinesSchema(PixelListSchema)]),
);

type PixelList = ReadonlyArray<Pixel>;
type PixelGrid = ReadonlyArray<PixelList>;
type Input = readonly [enhancement: PixelList, grid: PixelGrid];

type Cell = readonly [row: number, col: number];

interface PixelMap {
    readonly none: Pixel;
    readonly grid: PixelGrid;
}

const nearby = ([row, col]: Cell): ReadonlyArray<Cell> => {
    const cells: Cell[] = [];
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            cells.push([r, c]);
        }
    }
    return cells;
};

const enhance = (enhancement: PixelList, pixels: PixelList): Pixel => {
    if (enhancement.length !== 512) {
        throw new Error("Invalid enhancment");
    }
    if (pixels.length !== 9) {
        throw new Error("Invalid pixels");
    }
    const index = parseInt(pixels.map((pixel) => Bits[pixel]).join(""), 2);
    if (index < 0 || index >= enhancement.length) {
        throw new Error("Invalid index");
    }
    return enhancement[index];
};

const contains = (grid: PixelGrid, [row, col]: Cell): boolean =>
    row >= 0 && col >= 0 && row < grid.length && col < grid[0].length;

const valueOf = (grid: PixelGrid, cell: Cell, none: Pixel): Pixel => {
    if (!contains(grid, cell)) {
        return none;
    }
    const [row, col] = cell;
    return grid[row][col];
};

const evolve = (enhancement: PixelList, { none, grid }: PixelMap): PixelMap => {
    const next: Pixel[][] = [];
    for (let r = -1; r <= grid.length; r++) {
        const row: Pixel[] = [];
        for (let c = -1; c <= grid[0].length; c++) {
            row.push(
                enhance(
                    enhancement,
                    nearby([r, c]).map((cell) => valueOf(grid, cell, none)),
                ),
            );
        }
        next.push(row);
    }
    return {
        none: enhance(
            enhancement,
            Array.from({ length: 9 }, () => none),
        ),
        grid: next,
    };
};

const iterate = (
    enhancement: PixelList,
    map: PixelMap,
    count: number,
): number => {
    for (let i = 0; i < count; i++) {
        map = evolve(enhancement, map);
    }
    return map.grid.reduce(
        (sum, row) => sum + row.filter((pixel) => pixel === Pixel.Light).length,
        0,
    );
};

const part1 = ([enhancement, grid]: Input): number =>
    iterate(enhancement, { none: Pixel.Dark, grid }, 2);

const part2 = ([enhancement, grid]: Input): number =>
    iterate(enhancement, { none: Pixel.Dark, grid }, 50);

await main(import.meta, (input) => schema.parse(input), part1, part2);
