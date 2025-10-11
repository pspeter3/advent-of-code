import { main } from "../../utils/host.ts";

const parse = (input: string): string => input.trim();

const evolve = (sequence: string): string => {
    let result: string[] = [];
    let curr = sequence[0];
    let count = 1;
    for (let i = 1; i < sequence.length; i++) {
        if (sequence[i] === curr) {
            count++;
        } else {
            result.push(`${count}${curr}`);
            curr = sequence[i];
            count = 1;
        }
    }
    result.push(`${count}${curr}`);
    return result.join("");
};

const simulate = (sequence: string, n: number): number => {
    for (let i = 0; i < n; i++) {
        sequence = evolve(sequence);
    }
    return sequence.length;
};

const part1 = (input: string): number => simulate(input, 40);

const part2 = (input: string): number => simulate(input, 50);

await main(import.meta, parse, part1, part2);
