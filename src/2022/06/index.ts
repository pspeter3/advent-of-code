import { main } from "../../utils/host.ts";

const analyze = (input: string, packet: number): number => {
    for (let i = 0; i < input.length - packet; i++) {
        const seen = new Set(input.slice(i, i + packet));
        if (seen.size === packet) {
            return i + packet;
        }
    }
    return -1;
};

const part1 = (input: string): number => analyze(input, 4);

const part2 = (input: string): number => analyze(input, 14);

main(module, (input) => input.trim(), part1, part2);
