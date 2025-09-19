import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";

const CubeColor = { Red: "red", Green: "green", Blue: "blue" } as const;
type CubeColor = (typeof CubeColor)[keyof typeof CubeColor];

type CubeSample = ReadonlyMap<CubeColor, number>;

interface CubeGame {
    readonly id: number;
    readonly samples: ReadonlyArray<CubeSample>;
}

type CubeGameList = ReadonlyArray<CubeGame>;

const CubeColorSchema = z.nativeEnum(CubeColor);
const CubeEntrySchema = z
    .string()
    .transform((s) => s.split(" "))
    .pipe(z.tuple([IntSchema, CubeColorSchema]))
    .transform(([count, color]) => [color, count] as const);
const CubeSampleSchema = z
    .string()
    .transform((s) => s.split(", "))
    .pipe(z.array(CubeEntrySchema))
    .transform((entries) => new Map(entries));
const CubeGameSchema = z
    .string()
    .transform((s) => {
        const parts = s.split(": ");
        return {
            id: parts[0].replace("Game ", ""),
            samples: parts[1].split("; "),
        };
    })
    .pipe(
        z.object({
            id: IntSchema,
            samples: z.array(CubeSampleSchema),
        }),
    );
const CubeGameListSchema = LinesSchema(CubeGameSchema);

const isPossible = (
    filter: CubeSample,
    samples: ReadonlyArray<CubeSample>,
): boolean => {
    for (const sample of samples) {
        for (const [color, count] of filter) {
            const value = sample.get(color);
            if (value !== undefined && value > count) {
                return false;
            }
        }
    }
    return true;
};

const parse = (input: string): CubeGameList => CubeGameListSchema.parse(input);

const part1 = (input: CubeGameList): number => {
    const filter: CubeSample = new Map([
        [CubeColor.Red, 12],
        [CubeColor.Green, 13],
        [CubeColor.Blue, 14],
    ]);
    let sum = 0;
    for (const game of input) {
        if (isPossible(filter, game.samples)) {
            sum += game.id;
        }
    }
    return sum;
};

const part2 = (input: CubeGameList): number => {
    let sum = 0;
    for (const { samples } of input) {
        const max = new Map<CubeColor, number>([
            [CubeColor.Red, 0],
            [CubeColor.Green, 0],
            [CubeColor.Blue, 0],
        ]);
        for (const sample of samples) {
            for (const [color, count] of sample) {
                max.set(color, Math.max(max.get(color)!, count));
            }
        }
        let power = 1;
        for (const count of max.values()) {
            power *= count;
        }
        sum += power;
    }
    return sum;
};

await main(import.meta, parse, part1, part2);
