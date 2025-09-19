import fs from "node:fs/promises";
import path from "node:path";

const template = `import { main } from "../../utils/host.ts";

const parse = (input: string): unknown => null;

const part1 = (input: unknown): number => 0;

const part2 = (input: unknown): number => 0;

await main(import.meta, parse, part1, part2);
`;

async function generate(
    year: string = new Date().getFullYear().toString(),
): Promise<void> {
    const dirnames = await fs.readdir(path.join(__dirname, "..", year));
    const days = dirnames
        .map((dirname) => parseInt(dirname, 10))
        .sort((a, b) => a - b);
    const day = ((days.at(-1) ?? 0) + 1).toString().padStart(2, "0");
    const dirname = path.join(__dirname, "..", year, day);
    await fs.mkdir(dirname);
    await fs.writeFile(path.join(dirname, "example.txt"), "");
    await fs.writeFile(path.join(dirname, "index.ts"), template);
}

if (require.main === module) {
    generate(process.argv[2]).catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
