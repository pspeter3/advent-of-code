import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, LinesSchema } from "../../utils/schemas";

type NoOpCommand = "noop";
type AddXCommand = readonly [command: "addx", amount: number];

type Command = NoOpCommand | AddXCommand;
type CommandList = ReadonlyArray<Command>;

const schema = LinesSchema(
    z.union([
        z.literal("noop"),
        z
            .string()
            .transform((line) => line.split(" "))
            .pipe(z.tuple([z.literal("addx"), IntSchema])),
    ]),
);

const parse = (input: string): CommandList => schema.parse(input);

const part1 = (commands: CommandList): number => {
    let cycle = 0;
    let register = 1;
    let sum = 0;
    const tick = () => {
        cycle++;
        if ((cycle - 20) % 40 === 0) {
            sum += cycle * register;
        }
    };
    for (const command of commands) {
        if (command === "noop") {
            tick();
            continue;
        }
        tick();
        tick();
        register += command[1];
    }
    return sum;
};

const Pixel = {
    Lit: "#",
    Dark: ".",
} as const;
type Pixel = (typeof Pixel)[keyof typeof Pixel];

const part2 = (commands: CommandList): string => {
    const pixels: Array<Array<Pixel>> = Array.from({ length: 6 }, () =>
        Array.from({ length: 40 }, () => Pixel.Dark),
    );
    let cycle = 0;
    let register = 1;
    const tick = () => {
        cycle++;
        const r = Math.floor((cycle - 1) / 40) % 6;
        const q = (cycle - 1) % 40;
        const pixel = Math.abs(register - q) <= 1 ? Pixel.Lit : Pixel.Dark;
        pixels[r][q] = pixel;
    };
    for (const command of commands) {
        if (command === "noop") {
            tick();
            continue;
        }
        tick();
        tick();
        register += command[1];
    }
    return pixels.map((row) => row.join("")).join("\n");
};

main(module, parse, part1, part2);
