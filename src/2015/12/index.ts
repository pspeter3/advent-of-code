import { main } from "../../utils/host.ts";

type Value = string | number | Value[] | { [key: string]: Value };

function evaluate(value: Value): number {
    if (typeof value === "string") {
        return 0;
    }
    if (typeof value === "number") {
        return value;
    }
    const list = Array.isArray(value) ? value : Object.values(value);
    return list.reduce((sum: number, v: Value) => sum + evaluate(v), 0);
}

function evaluateNonRed(value: Value): number {
    if (typeof value === "string") {
        return 0;
    }
    if (typeof value === "number") {
        return value;
    }
    if (Array.isArray(value)) {
        return value.reduce(
            (sum: number, v: Value) => sum + evaluateNonRed(v),
            0,
        );
    }
    let sum = 0;
    for (const v of Object.values(value)) {
        if (v === "red") {
            return 0;
        }
        sum += evaluateNonRed(v);
    }
    return sum;
}

const parse = (input: string): Value => JSON.parse(input);

const part1 = (value: Value): number => evaluate(value);

const part2 = (value: Value): number => evaluateNonRed(value);

await main(import.meta, parse, part1, part2);
