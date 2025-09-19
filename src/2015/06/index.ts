import z from "zod";
import {
    GridBounds2D,
    GridVector2D,
    GridVector2DMap,
    type GridVector2DRecord,
    GridVector2DSet,
} from "../../common/grid2d.ts";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { sum } from "../../common/itertools.ts";

const Command = {
    TurnOn: "turn on",
    Toggle: "toggle",
    TurnOff: "turn off",
} as const;
type Command = (typeof Command)[keyof typeof Command];

export interface Instruction {
    readonly command: Command;
    readonly source: GridVector2DRecord;
    readonly target: GridVector2DRecord;
}

export type InstructionList = ReadonlyArray<Instruction>;

const GridVector2DRecordSchema = z.object({
    q: IntSchema,
    r: IntSchema,
});

const InstructionSchema = z
    .string()
    .transform((line) => {
        const match = line.match(/^(.+) (\d+),(\d+) through (\d+),(\d+)$/);
        return {
            command: match?.at(1),
            source: { q: match?.at(2), r: match?.at(3) },
            target: { q: match?.at(4), r: match?.at(5) },
        };
    })
    .pipe(
        z.object({
            command: z.nativeEnum(Command),
            source: GridVector2DRecordSchema,
            target: GridVector2DRecordSchema,
        }),
    );

const InstructionListSchema = LinesSchema(InstructionSchema);

const parse = (input: string): InstructionList =>
    InstructionListSchema.parse(input);

const part1 = (instructions: InstructionList): number => {
    const grid = GridBounds2D.fromOrigin({ q: 1000, r: 1000 });
    const lights = new GridVector2DSet(grid);
    for (const { command, source, target } of instructions) {
        for (let q = source.q; q <= target.q; q++) {
            for (let r = source.r; r <= target.r; r++) {
                const cell = new GridVector2D(q, r);
                switch (command) {
                    case Command.TurnOn: {
                        lights.add(cell);
                        break;
                    }
                    case Command.TurnOff: {
                        lights.delete(cell);
                        break;
                    }
                    case Command.Toggle: {
                        lights.has(cell)
                            ? lights.delete(cell)
                            : lights.add(cell);
                        break;
                    }
                }
            }
        }
    }
    return lights.size;
};

const part2 = (instructions: InstructionList): number => {
    const grid = GridBounds2D.fromOrigin({ q: 1000, r: 1000 });
    const lights = new GridVector2DMap<number>(grid);
    for (const { command, source, target } of instructions) {
        for (let q = source.q; q <= target.q; q++) {
            for (let r = source.r; r <= target.r; r++) {
                const cell = new GridVector2D(q, r);
                const value = lights.get(cell) ?? 0;
                switch (command) {
                    case Command.TurnOn: {
                        lights.set(cell, value + 1);
                        break;
                    }
                    case Command.TurnOff: {
                        lights.set(cell, Math.max(value - 1, 0));
                        break;
                    }
                    case Command.Toggle: {
                        lights.set(cell, value + 2);
                        break;
                    }
                }
            }
        }
    }
    return sum(lights.values());
};

await main(import.meta, parse, part1, part2);
