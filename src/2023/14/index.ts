import { sum } from "../../common/itertools";
import { main } from "../../utils/host";

const RockKind = {
    Round: "O",
    Cube: "#",
} as const;
type RockKind = (typeof RockKind)[keyof typeof RockKind];

interface Rock {
    readonly kind: RockKind;
    readonly q: number;
    readonly r: number;
}

interface Platform {
    readonly cols: number;
    readonly rows: number;
    readonly rocks: ReadonlyArray<Rock>;
}

const isRockKind = (char: string): char is RockKind =>
    char === RockKind.Round || char === RockKind.Cube;

type RockGrouper = (rock: Rock) => number;
type RockComparator = (a: Rock, b: Rock) => number;
type RockShifter = (prev: Rock | undefined, curr: Rock) => Rock;

const tilt = (
    { cols, rows, rocks }: Platform,
    group: RockGrouper,
    compare: RockComparator,
    shift: RockShifter,
): Platform => ({
    cols,
    rows,
    rocks: Array.from(
        Map.groupBy(rocks, group)
            .values()
            .map((line) => {
                const list = line.toSorted(compare);
                const result: Rock[] = [];
                for (const rock of list) {
                    result.push(
                        rock.kind === RockKind.Cube
                            ? rock
                            : shift(result.at(-1), rock),
                    );
                }
                return result;
            }),
    ).flat(),
});

const tiltNorth = (platform: Platform): Platform =>
    tilt(
        platform,
        ({ q }) => q,
        (a, b) => a.r - b.r,
        (prev, curr) => ({ ...curr, r: prev === undefined ? 0 : prev.r + 1 }),
    );

const tiltSouth = (platform: Platform): Platform =>
    tilt(
        platform,
        ({ q }) => q,
        (a, b) => b.r - a.r,
        (prev, curr) => ({
            ...curr,
            r: prev === undefined ? platform.rows - 1 : prev.r - 1,
        }),
    );

const tiltWest = (platform: Platform): Platform =>
    tilt(
        platform,
        ({ r }) => r,
        (a, b) => a.q - b.q,
        (prev, curr) => ({ ...curr, q: prev === undefined ? 0 : prev.q + 1 }),
    );

const tiltEast = (platform: Platform): Platform =>
    tilt(
        platform,
        ({ r }) => r,
        (a, b) => b.q - a.q,
        (prev, curr) => ({
            ...curr,
            q: prev === undefined ? platform.cols - 1 : prev.q - 1,
        }),
    );

const SPIN_CYCLE = [tiltNorth, tiltWest, tiltSouth, tiltEast] as const;

const cycle = (platform: Platform): Platform =>
    SPIN_CYCLE.reduce((p, next) => next(p), platform);

const serialize = ({ cols, rows, rocks }: Platform): string =>
    rocks
        .reduce(
            (list, { kind, q, r }) => {
                list[cols * r + q] = kind;
                return list;
            },
            Array.from({ length: cols * rows }, () => "."),
        )
        .join("");

interface PlatformCycle {
    readonly offset: number;
    readonly period: number;
    readonly platforms: ReadonlyArray<Platform>;
}

function* count(): Iterable<number> {
    let current = 0;
    while (true) {
        yield current++;
    }
}

type PlatformEntry = readonly [index: number, platform: Platform];

function findCycle(platform: Platform): PlatformCycle {
    const cache = new Map<string, PlatformEntry>();
    let current = platform;
    for (const i of count()) {
        const key = serialize(current);
        const entry = cache.get(key);
        if (entry) {
            const [offset] = entry;
            const period = i - offset;
            const index = new Map(cache.values());
            const platforms = Array.from(
                { length: period },
                (_, j) => index.get(offset + j)!,
            );
            return { offset, period, platforms };
        }
        cache.set(key, [i, current]);
        current = cycle(current);
    }
    throw new Error("Unreachable");
}

const load = ({ rows, rocks }: Platform): number =>
    sum(
        rocks
            .values()
            .filter(({ kind }) => kind === RockKind.Round)
            .map(({ r }) => rows - r),
    );

const parse = (input: string): Platform => {
    const lines = input.trim().split("\n");
    const cols = lines[0].length;
    const rows = lines.length;
    const rocks: Rock[] = [];
    for (const [r, line] of lines.entries()) {
        for (const [q, kind] of line.split("").entries()) {
            if (!isRockKind(kind)) {
                continue;
            }
            rocks.push({ kind, q, r });
        }
    }
    return { cols, rows, rocks };
};

const part1 = (platform: Platform): number => load(tiltNorth(platform));

const part2 = (platform: Platform): number => {
    const { offset, period, platforms } = findCycle(platform);
    const index = (1_000_000_000 - offset) % period;
    return load(platforms[index]);
};

main(module, parse, part1, part2);
