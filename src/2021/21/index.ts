import { z } from "zod";
import { main } from "../../utils/host";
import { IntSchema, StringSchema } from "../../utils/schemas";

const PositionSchema = z.preprocess(
    (line) => StringSchema.parse(line).trim().split(": ")[1],
    IntSchema
);

const schema = z.preprocess(
    (input) => StringSchema.parse(input).trim().split("\n"),
    z.tuple([PositionSchema, PositionSchema])
);

type Pair = readonly [a: number, b: number];
type Game = readonly [positions: Pair, scores: Pair];

const set = (pair: Pair, index: number, value: number): Pair =>
    pair.map((v, i) => (i === index ? value : v)) as unknown as Pair;

const increment = (pair: Pair, index: number, value: number): Pair =>
    set(pair, index, pair[index] + value);

const move = (position: number, delta: number): number =>
    ((position + delta - 1) % 10) + 1;

const part1 = (positions: Pair): number => {
    const scores = Array.from(positions, () => 0);
    const current = Array.from(positions);
    let turn = 0;
    while (Math.max(...scores) < 1000) {
        const index = turn % current.length;
        const delta = Array.from(
            { length: 3 },
            (_, v) => ((3 * turn + v) % 100) + 1
        ).reduce((sum, value) => sum + value);
        current[index] = move(current[index], delta);
        scores[index] += current[index];
        turn++;
    }
    return Math.min(...scores) * (3 * turn);
};

const serialize = (game: Game): string => JSON.stringify(game);
const parse = (key: string): Game => JSON.parse(key);

const evolve = (
    turn: number,
    [positions, scores]: Game,
    delta: number
): string => {
    const index = turn % positions.length;
    const p = set(positions, index, move(positions[index], delta));
    const s = increment(scores, index, p[index]);
    return serialize([p, s]);
};

const part2 = (positions: Pair): number => {
    let wins: Pair = [0, 0];
    let games: ReadonlyMap<string, number> = new Map([
        [serialize([positions, [0, 0]]), 1],
    ]);
    const rolls = new Map<number, number>();
    const dice: ReadonlyArray<number> = [1, 2, 3];
    for (const a of dice) {
        for (const b of dice) {
            for (const c of dice) {
                const delta = a + b + c;
                rolls.set(delta, (rolls.get(delta) ?? 0) + 1);
            }
        }
    }
    for (let turn = 0; games.size > 0; turn++) {
        const next = new Map<string, number>();
        for (const [key, total] of games) {
            const game = parse(key);
            const winner = game[1].findIndex((score) => score >= 21);
            if (winner !== -1) {
                wins = increment(wins, winner, total);
                continue;
            }
            for (const [delta, count] of rolls) {
                const key = evolve(turn, game, delta);
                next.set(key, (next.get(key) ?? 0) + total * count);
            }
        }
        games = next;
    }
    return Math.max(...wins);
};

main(module, schema, part1, part2);
