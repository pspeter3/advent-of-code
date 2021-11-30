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
