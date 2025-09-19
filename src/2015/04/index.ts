import crypto from "node:crypto";
import { main } from "../../utils/host.ts";

function mine(key: string, size: number): number {
    const prefix = Array.from({ length: size }, () => 0).join("");
    let i = 1;
    while (true) {
        const hash = crypto
            .createHash("md5")
            .update(`${key}${i}`)
            .digest("hex");
        if (hash.startsWith(prefix)) {
            return i;
        }
        i++;
    }
}

const parse = (input: string): string => input.trim();

const part1 = (key: string): number => mine(key, 5);

const part2 = (key: string): number => mine(key, 6);

main(module, parse, part1, part2);
