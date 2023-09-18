import { main } from "../../utils/host";

type Elf = ReadonlyArray<number>;
type Inventory = ReadonlyArray<Elf>;

const parse = (input: string): Inventory =>
    input
        .trim()
        .split("\n\n")
        .map((elf) => elf.split("\n").map((line) => parseInt(line, 10)));

const calories = (elf: Elf): number => elf.reduce((sum, value) => sum + value);

const part1 = (inventory: Inventory): number => {
    let max = 0;
    for (const elf of inventory) {
        max = Math.max(calories(elf), max);
    }
    return max;
};

const part2 = (inventory: Inventory): number =>
    calories(
        inventory
            .map((elf) => calories(elf))
            .sort((a, b) => b - a)
            .slice(0, 3),
    );

main(module, parse, part1, part2);
