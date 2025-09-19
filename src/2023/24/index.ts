import z from "zod";
import { main } from "../../utils/host.ts";
import { IntSchema, LinesSchema } from "../../utils/schemas.ts";
import { NumberRange } from "../../common/number-range.ts";
import { len, sum } from "../../common/itertools.ts";

interface Vector2D {
    readonly x: number;
    readonly y: number;
}

interface Vector3D extends Vector2D {
    readonly z: number;
}

type Vector3DKey = keyof Vector3D;

interface Ray2D {
    readonly position: Vector2D;
    readonly velocity: Vector2D;
}

interface Ray3D {
    readonly position: Vector3D;
    readonly velocity: Vector3D;
}

const Vector3DSchema = z
    .string()
    .transform((part) => part.split(/,\s+/g))
    .pipe(z.tuple([IntSchema, IntSchema, IntSchema]))
    .transform(([x, y, z]) => ({ x, y, z }));
const Ray3DSchema = z
    .string()
    .transform((line) => line.split(/\s+@\s+/))
    .pipe(z.tuple([Vector3DSchema, Vector3DSchema]))
    .transform(([position, velocity]) => ({ position, velocity }));
const Schema = LinesSchema(Ray3DSchema);

function collides2D(a: Ray2D, b: Ray2D): Vector2D | null {
    const dx = b.position.x - a.position.x;
    const dy = b.position.y - a.position.y;
    const det = b.velocity.x * a.velocity.y - b.velocity.y * a.velocity.x;
    if (det === 0) {
        return null;
    }
    const u = (dy * b.velocity.x - dx * b.velocity.y) / det;
    const v = (dy * a.velocity.x - dx * a.velocity.y) / det;
    if (u < 0 || v < 0) {
        return null;
    }
    return {
        x: a.position.x + a.velocity.x * u,
        y: a.position.y + a.velocity.y * u,
    };
}

type Pair<T> = readonly [a: T, b: T];

function* pairs<T>(list: ReadonlyArray<T>): Generator<Pair<T>> {
    for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
            yield [list[i], list[j]];
        }
    }
}

const solve2D = (rays: ReadonlyArray<Ray2D>, range: NumberRange): number =>
    len(
        pairs(rays)
            .map(([a, b]) => collides2D(a, b))
            .filter(
                (vector) =>
                    vector !== null &&
                    range.includes(vector.x) &&
                    range.includes(vector.y),
            ),
    );

const findComponents = (
    rays: ReadonlyArray<Ray3D>,
    key: Vector3DKey,
): ReadonlyMap<number, ReadonlyArray<number>> =>
    new Map(
        Map.groupBy(rays, ({ velocity }) => velocity[key])
            .entries()
            .filter(([_, value]) => value.length > 1)
            .map(([k, list]) => [
                k,
                Array.from(
                    pairs(list),
                    ([{ position: a }, { position: b }]) => a[key] - b[key],
                ),
            ]),
    );

function findComponentVelocity(
    components: ReadonlyMap<number, ReadonlyArray<number>>,
): number {
    let result: Set<number> = new Set(new NumberRange(-500, 501));
    for (const [key, deltas] of components) {
        for (const d of deltas) {
            for (const v of result) {
                if (d % (v - key) !== 0) {
                    result.delete(v);
                }
            }
        }
    }
    if (result.size !== 1) {
        throw new Error("Invalid velocity set");
    }
    return Array.from(result)[0];
}

const findVelocity = (rays: ReadonlyArray<Ray3D>): Vector3D => ({
    x: findComponentVelocity(findComponents(rays, "x")),
    y: findComponentVelocity(findComponents(rays, "y")),
    z: findComponentVelocity(findComponents(rays, "z")),
});

function findPosition(
    [a, b]: ReadonlyArray<Ray3D>,
    velocity: Vector3D,
): Vector3D {
    const mA = (a.velocity.y - velocity.y) / (a.velocity.x - velocity.x);
    const mB = (b.velocity.y - velocity.y) / (b.velocity.x - velocity.x);
    const cA = a.position.y - mA * a.position.x;
    const cB = b.position.y - mB * b.position.x;
    const x = (cB - cA) / (mA - mB);
    const y = mA * x + cA;
    const t = Math.floor((x - a.position.x) / (a.velocity.x - velocity.x));
    const z = a.position.z + (a.velocity.z - velocity.z) * t;
    return { x, y, z };
}

const parse = (input: string): ReadonlyArray<Ray3D> => Schema.parse(input);

const part1 = (rays: ReadonlyArray<Ray3D>): number =>
    solve2D(
        rays,
        rays.length === 5
            ? new NumberRange(7, 28)
            : new NumberRange(200000000000000, 400000000000000 + 1),
    );

const part2 = (rays: ReadonlyArray<Ray3D>): number =>
    sum(
        Object.values(
            findPosition(
                rays,
                rays.length === 5 ? { x: -3, y: 1, z: 2 } : findVelocity(rays),
            ),
        ),
    );

await main(import.meta, parse, part1, part2);
