import { memoize } from "../../common/functools.ts";
import { GridVector2D } from "../../common/grid2d.ts";
import { sum } from "../../common/itertools.ts";
import { main } from "../../utils/host.ts";

type AcceptKey = "A";
type EmptyKey = "#";
type NumericKey = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type DirectionKey = "<" | ">" | "^" | "v";

type NumericKeypadKey = NumericKey | AcceptKey | EmptyKey;
type DirectionalKeypadKey = DirectionKey | AcceptKey | EmptyKey;
type KeypadKey = NumericKeypadKey | DirectionalKeypadKey;

const NumericKeypad = new Map<NumericKeypadKey, GridVector2D>([
    ["7", new GridVector2D(0, 0)],
    ["8", new GridVector2D(1, 0)],
    ["9", new GridVector2D(2, 0)],
    ["4", new GridVector2D(0, 1)],
    ["5", new GridVector2D(1, 1)],
    ["6", new GridVector2D(2, 1)],
    ["1", new GridVector2D(0, 2)],
    ["2", new GridVector2D(1, 2)],
    ["3", new GridVector2D(2, 2)],
    ["#", new GridVector2D(0, 3)],
    ["0", new GridVector2D(1, 3)],
    ["A", new GridVector2D(2, 3)],
]);

const DirectionalKeypad = new Map<DirectionalKeypadKey, GridVector2D>([
    ["#", new GridVector2D(0, 0)],
    ["^", new GridVector2D(1, 0)],
    ["A", new GridVector2D(2, 0)],
    ["<", new GridVector2D(0, 1)],
    ["v", new GridVector2D(1, 1)],
    [">", new GridVector2D(2, 1)],
]);

type KeypadPathSet = ReadonlySet<string>;

const toDirections = (vectors: ReadonlyArray<GridVector2D>): string =>
    vectors
        .map((v) => {
            if (v.q !== 0 && v.r !== 0) {
                throw new Error("Invalid vector");
            }
            const isVertical = v.q === 0;
            const delta = isVertical ? v.r : v.q;
            const isPositive = delta > 0;
            const char = isVertical
                ? isPositive
                    ? "v"
                    : "^"
                : isPositive
                  ? ">"
                  : "<";
            return Array.from({ length: Math.abs(delta) })
                .map(() => char)
                .join("");
        })
        .join("");

const toKeypadPathSet = <K extends KeypadKey>(
    keypad: ReadonlyMap<K, GridVector2D>,
    source: K,
    target: K,
): KeypadPathSet => {
    const paths = new Set<string>();
    const s = keypad.get(source)!;
    const t = keypad.get(target)!;
    const h = new GridVector2D(t.q - s.q, 0);
    const v = new GridVector2D(0, t.r - s.r);
    const invalid = keypad.get("#" as K)!;
    if (!s.add(h).equals(invalid)) {
        paths.add(toDirections([h, v]));
    }
    if (!s.add(v).equals(invalid)) {
        paths.add(toDirections([v, h]));
    }
    return paths;
};

const findKeyPaths = (
    keypad: ReadonlyMap<KeypadKey, GridVector2D>,
    code: string,
): ReadonlyArray<ReadonlySet<string>> => {
    const result: ReadonlySet<string>[] = [
        toKeypadPathSet(keypad, "A", code[0] as KeypadKey),
    ];
    for (let i = 1; i < code.length; i++) {
        result.push(
            toKeypadPathSet(
                keypad,
                code[i - 1] as KeypadKey,
                code[i] as KeypadKey,
            ),
        );
    }
    return result;
};

const findSequence = memoize(
    (code: string, depth: number, limit: number): number => {
        if (depth > limit) {
            return code.length;
        }
        let size = 0;
        for (const paths of findKeyPaths(
            depth === 0 ? NumericKeypad : DirectionalKeypad,
            code,
        )) {
            size += paths
                .values()
                .map((path) => findSequence(`${path}A`, depth + 1, limit))
                .reduce((a, b) => Math.min(a, b), Infinity);
        }
        return size;
    },
);

const parse = (input: string): ReadonlyArray<string> =>
    input.trim().split("\n");

const part1 = (codes: ReadonlyArray<string>): number =>
    sum(
        codes
            .values()
            .map(
                (code) =>
                    findSequence(code, 0, 2) * parseInt(code.slice(0, -1), 10),
            ),
    );

const part2 = (codes: ReadonlyArray<string>): number =>
    sum(
        codes
            .values()
            .map(
                (code) =>
                    findSequence(code, 0, 25) * parseInt(code.slice(0, -1), 10),
            ),
    );

main(module, parse, part1, part2);
