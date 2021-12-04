import fs from "fs";
import path from "path";
import { ZodType, ZodTypeDef } from "zod";

export type Solution<T> = (data: T) => unknown;

/**
 * Times solutions
 * @param mod The host module
 * @param schema The Zod schema for parsing
 * @param solutions The solutions
 */
export function main<T>(
    mod: NodeModule,
    schema: ZodType<T, ZodTypeDef, T>,
    ...solutions: Solution<T>[]
): void {
    if (require.main === mod) {
        console.time("Load");
        const input = fs.readFileSync(
            path.join(path.dirname(mod.filename), "input.txt"),
            "utf8"
        );
        console.timeEnd("Load");
        console.time("Parse");
        const data = schema.parse(input);
        console.timeEnd("Parse");
        for (const [index, solution] of solutions.entries()) {
            const label = `Part ${index + 1}`;
            console.time(label);
            const result = solution(data);
            console.timeEnd(label);
            console.log(result);
        }
    }
}
