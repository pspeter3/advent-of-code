import fs from "fs";
import path from "path";

export type Parser<T> = (input: string) => T;
export type Solution<T> = (data: T) => unknown;

/**
 * Times solutions
 * @param mod The host module
 * @param parse The input parser
 * @param solutions The solutions
 */
export function main<T>(
    mod: NodeModule,
    parse: Parser<T>,
    ...solutions: Solution<T>[]
): void {
    if (require.main === mod) {
        exec("Example", mod, parse, solutions);
        exec("Input", mod, parse, solutions);
    }
}

function exec<T>(
    group: string,
    mod: NodeModule,
    parse: Parser<T>,
    solutions: Solution<T>[]
): void {
    const filename = path.join(
        path.dirname(mod.filename),
        `${group.toLowerCase()}.txt`
    );
    if (!fs.existsSync(filename)) {
        return;
    }
    console.group(group);
    console.time("Load");
    const input = fs.readFileSync(filename, "utf8");
    console.timeEnd("Load");
    console.time("Parse");
    const data = parse(input);
    console.timeEnd("Parse");
    for (const [index, solution] of solutions.entries()) {
        const label = `Part ${index + 1}`;
        console.time(label);
        const result = solution(data);
        console.timeEnd(label);
        console.log(result);
    }
    console.groupEnd();
}
