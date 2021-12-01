import fs from "fs/promises";
import path from "path";

export interface Solution<I, O> {
    setup(input: string): I;
    part1(input: I): O;
    part2?(input: I): O;
}

/**
 * Executes the solution if the module is main.
 * @param mod The module.
 * @param solution The solution.
 */
export function main<I, O>(mod: NodeModule, solution: Solution<I, O>): void {
    if (require.main === mod) {
        solve(path.dirname(mod.filename), solution).catch(exit);
    }
}

async function solve<I, O>(
    dirname: string,
    { setup, part1, part2 }: Solution<I, O>
): Promise<void> {
    const contents = await fs.readFile(path.join(dirname, "input.txt"), "utf8");
    const input = time("Setup", setup, contents);
    console.log(time("Part 1", part1, input));
    if (part2) {
        console.log(time("Part 2", part2, input));
    }
}

function time<A, R>(label: string, callback: (args: A) => R, args: A): R {
    console.time(label);
    const result = callback(args);
    console.timeEnd(label);
    return result;
}
function exit(err: Error): void {
    console.error(err);
    process.exitCode = 1;
}
