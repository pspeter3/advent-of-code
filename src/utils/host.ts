import fs from "fs/promises";
import path from "path";

/**
 * Reads input relative to the solution.
 * @param dirname The solution directory name.
 * @returns The file contents.
 */
export async function readInput(dirname: string): Promise<string> {
    return await fs.readFile(path.join(dirname, "input.txt"), "utf8");
}

/**
 * A solution for part of a problem.
 */
export type Solution<T> = () => T;

/**
 * Create an array of solutions.
 */
export type SolutionFactory<T> = () => Promise<ReadonlyArray<Solution<T>>>;

/**
 * Registers a factory as the main function.
 * @param mod The parent module to register.
 * @param factory The solution factory.
 */
export function main<T>(mod: NodeModule, factory: SolutionFactory<T>): void {
    if (require.main === mod) {
        solve(factory).catch((err) => {
            console.error(err);
            process.exitCode = 1;
        });
    }
}

/**
 * Runs a set of solutions from a factory.
 * @param factory The factory for solutions.
 */
async function solve<T>(factory: SolutionFactory<T>): Promise<void> {
    console.time("Setup");
    const solutions = await factory();
    console.timeEnd("Setup");
    for (const [index, solution] of solutions.entries()) {
        const label = `Part ${index + 1}`;
        console.time(label);
        console.log(solution());
        console.timeEnd(label);
    }
}
