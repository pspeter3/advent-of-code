import { z } from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, StringSchema } from "../../utils/schemas.ts";

const VectorSchema = z.preprocess(
    (line) => StringSchema.parse(line).trim().split(","),
    z.tuple([IntSchema, IntSchema, IntSchema]),
);

const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split("\n\n"),
    z.array(
        z.preprocess(
            (group) => StringSchema.parse(group).trim().split("\n").slice(1),
            z.array(VectorSchema),
        ),
    ),
);

type Vector = readonly [x: number, y: number, z: number];
type Sensor = ReadonlyArray<Vector>;
type Rotation = readonly [facing: Vector, direction: Vector];

const FACINGS: ReadonlyArray<Vector> = [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
];

const SIGNS: ReadonlyArray<Vector> = Array.from(
    { length: Math.pow(2, 3) },
    (_, index) =>
        index
            .toString(2)
            .padStart(3, "0")
            .split("")
            .map((value) => [1, -1][parseInt(value)]) as unknown as Vector,
);

const ROTATIONS: ReadonlyArray<Rotation> = FACINGS.map((facing) =>
    SIGNS.map((sign) => [facing, sign] as Rotation),
).flat();

const serialize = (vector: Vector): string => vector.join(",");

const apply = (vector: Vector, [[i, j, k], [a, b, c]]: Rotation): Vector => [
    vector[i] * a,
    vector[j] * b,
    vector[k] * c,
];

const delta = ([x1, y1, z1]: Vector, [x2, y2, z2]: Vector): Vector => [
    x1 - x2,
    y1 - y2,
    z1 - z2,
];

type Match = readonly [position: Vector, beacons: ReadonlySet<string>];

const align = (
    sensor: Sensor,
    rotations: ReadonlyArray<Sensor>,
    beacons: ReadonlySet<string>,
): Match | null => {
    for (const [r, rotated] of rotations.entries()) {
        const offsets = new Map<string, number>();
        for (const b of beacons) {
            const beacon = VectorSchema.parse(b);
            for (const vector of rotated) {
                const position = delta(vector, beacon);
                const offset = serialize(position);
                offsets.set(offset, (offsets.get(offset) ?? 0) + 1);
                if (offsets.get(offset)! >= 12) {
                    return [
                        position,
                        new Set(
                            sensor.map((vector) =>
                                serialize(
                                    delta(
                                        apply(vector, ROTATIONS[r]),
                                        position,
                                    ),
                                ),
                            ),
                        ),
                    ];
                }
            }
        }
    }
    return null;
};

const absolute = (
    sensors: ReadonlyArray<Sensor>,
): readonly [positions: ReadonlyMap<number, Vector>, beacons: number] => {
    const rotations: ReadonlyArray<ReadonlyArray<Sensor>> = sensors.map(
        (sensor) =>
            ROTATIONS.map((rotation) =>
                sensor.map((vector) => apply(vector, rotation)),
            ),
    );
    const positions = new Map<number, Vector>([[0, [0, 0, 0]]]);
    const beacons = new Set(sensors[0].map(serialize));
    while (positions.size < sensors.length) {
        for (const [index, sensor] of sensors.entries()) {
            if (positions.has(index)) {
                continue;
            }
            const match = align(sensor, rotations[index], beacons);
            if (match === null) {
                continue;
            }
            const [position, absolute] = match;
            positions.set(index, position);
            for (const beacon of absolute) {
                beacons.add(beacon);
            }
        }
    }
    return [positions, beacons.size];
};

const part1 = (sensors: ReadonlyArray<Sensor>): number => absolute(sensors)[1];

const part2 = (sensors: ReadonlyArray<Sensor>): number => {
    const positions = absolute(sensors)[0];
    let max = -Infinity;
    for (const a of positions.values()) {
        for (const b of positions.values()) {
            max = Math.max(
                max,
                delta(a, b).reduce((sum, value) => sum + Math.abs(value), 0),
            );
        }
    }
    return max;
};

main(module, (input) => schema.parse(input), part1, part2);
