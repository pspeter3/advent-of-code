import z from "zod";
import { main } from "../../utils/host";
import { sum } from "../../common/itertools";

const Instruction = {
    Up: "(",
    Down: ")",
} as const;
type Instruction = (typeof Instruction)[keyof typeof Instruction];

type InstructionList = ReadonlyArray<Instruction>;

const InstructionListSchema = z
    .string()
    .transform((line) => line.trim().split(""))
    .pipe(z.array(z.nativeEnum(Instruction)));

const parse = (input: string): InstructionList =>
    InstructionListSchema.parse(input);

const part1 = (instructions: InstructionList): number =>
    sum(
        instructions
            .values()
            .map((instruction) => (instruction === Instruction.Down ? -1 : 1)),
    );

const part2 = (instructions: InstructionList): number => {
    let floor = 0;
    let position = 0;
    for (const instruction of instructions) {
        floor += instruction === Instruction.Down ? -1 : 1;
        position++;
        if (floor === -1) {
            return position;
        }
    }
    throw new Error("Never entered basement");
};

main(module, parse, part1, part2);
