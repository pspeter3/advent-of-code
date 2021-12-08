import { z } from "zod";
import { main } from "../../utils/host";
import { LinesSchema, StringSchema } from "../../utils/schemas";

type Signal = ReadonlyArray<string>;
type Entry = readonly [input: Signal, output: Signal];

const Signal = z.preprocess(
    (tokens) => StringSchema.parse(tokens).trim().split(" "),
    z.array(StringSchema)
);

const schema = LinesSchema(
    z.preprocess(
        (line) => StringSchema.parse(line).split(" | "),
        z.tuple([Signal, Signal])
    )
);

const fromDigits = (digits: ReadonlyArray<number>): number =>
    digits.reduce(
        (sum, digit, index) =>
            sum + Math.pow(10, digits.length - index - 1) * digit,
        0
    );

const sorted = (wire: string): string => Array.from(wire).sort().join("");

const find = (
    wires: Set<string>,
    callback: (wire: string) => boolean
): string => {
    for (const wire of wires) {
        if (callback(wire)) {
            wires.delete(wire);
            return sorted(wire);
        }
    }
    throw new Error("Could not find wire");
};

const hasLength =
    (length: number) =>
    (wire: string): boolean =>
        wire.length === length;

const isSuperset = <T>(a: ReadonlySet<T>, b: ReadonlySet<T>): boolean => {
    for (const value of b) {
        if (!a.has(value)) {
            return false;
        }
    }
    return true;
};

const sub = <T>(a: ReadonlySet<T>, b: ReadonlySet<T>): ReadonlySet<T> => {
    const result = new Set<T>(a);
    for (const value of b) {
        result.delete(value);
    }
    return result;
};

const analyze = (signal: Signal): ReadonlyMap<string, number> => {
    const results = Array.from({ length: signal.length }, () => "");
    const wires = new Set(signal);
    results[1] = find(wires, hasLength(2));
    results[4] = find(wires, hasLength(4));
    results[7] = find(wires, hasLength(3));
    results[8] = find(wires, hasLength(7));
    const one = new Set(results[1]);
    const four = new Set(results[4]);
    const seven = new Set(results[7]);
    results[6] = find(
        wires,
        (wire) => wire.length === 6 && !isSuperset(new Set(wire), one)
    );
    results[9] = find(wires, (wire) => {
        const chars = new Set(wire);
        return (
            wire.length === 6 &&
            isSuperset(chars, four) &&
            isSuperset(chars, seven)
        );
    });
    results[0] = find(wires, hasLength(6));
    results[3] = find(wires, (wire) => isSuperset(new Set(wire), one));
    const delta = sub(four, one);
    results[5] = find(wires, (wire) => isSuperset(new Set(wire), delta));
    results[2] = find(wires, () => wires.size === 1);
    return new Map(results.map((value, index) => [value, index]));
};

const part1 = (data: ReadonlyArray<Entry>): number => {
    const unique = new Set([2, 3, 4, 7]);
    return data.reduce(
        (sum, [_, output]) =>
            sum + output.filter((value) => unique.has(value.length)).length,
        0
    );
};

const part2 = (data: ReadonlyArray<Entry>): number =>
    data.reduce((sum, [input, output], index) => {
        const key = analyze(input);
        return sum + fromDigits(output.map((value) => key.get(sorted(value))!));
    }, 0);

main(module, schema, part1, part2);
