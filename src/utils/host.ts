import fs from "node:fs/promises";
import path from "node:path";

export type Parser<T> = (input: string) => T;
export type Solution<T> = (data: T) => unknown;

/**
 * Times solutions
 * @param parse The input parser
 * @param solutions The solutions
 */
export async function main<T>(
  meta: ImportMeta,
  parse: Parser<T>,
  ...solutions: Solution<T>[]
): Promise<void> {
  await exec("Example", meta, parse, solutions);
  await exec("Input", meta, parse, solutions);
}

async function exec<T>(
  group: string,
  meta: ImportMeta,
  parse: Parser<T>,
  solutions: Solution<T>[],
): Promise<void> {
  const filename = path.join(meta.dirname, `${group.toLowerCase()}.txt`);
  if (!(await exists(filename))) {
    return;
  }
  console.group(group);
  console.time(`Load ${group}`);
  const input = await fs.readFile(filename, "utf8");
  console.timeEnd(`Load ${group}`);
  console.time(`Parse ${group}`);
  const data = parse(input);
  console.timeEnd(`Parse ${group}`);
  for (const [index, solution] of solutions.entries()) {
    const label = `Part ${index + 1}`;
    console.time(label);
    const result = solution(data);
    console.timeEnd(label);
    console.log(result);
  }
  console.groupEnd();
}

async function exists(filename: string): Promise<boolean> {
  try {
    await fs.stat(filename);
    return true;
  } catch {
    return false;
  }
}
