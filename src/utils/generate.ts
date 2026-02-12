import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const template = `import { main } from "../../utils/host.ts";

const parse = (input: string): unknown => null;

const part1 = (input: unknown): number => 0;

const part2 = (input: unknown): number => 0;

await main(import.meta, parse, part1, part2);
`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const year = process.argv[2] ?? new Date().getFullYear().toString();
const dirnames = await fs.readdir(path.join(__dirname, "..", year));
const days = dirnames.map((dirname) => parseInt(dirname, 10)).sort((a, b) => a - b);
const day = ((days.at(-1) ?? 0) + 1).toString().padStart(2, "0");
const dirname = path.join(__dirname, "..", year, day);
await fs.mkdir(dirname);
await fs.writeFile(path.join(dirname, "example.txt"), "");
await fs.writeFile(path.join(dirname, "index.ts"), template);
