import { z } from "zod";
import { main } from "../../utils/host.ts";
import { LinesSchema, StringSchema } from "../../utils/schemas.ts";

const OPPONENT = ["A", "B", "C"] as const;
const PLAYER = ["X", "Y", "Z"] as const;

const Opponent = z.enum(OPPONENT);
type Opponent = z.infer<typeof Opponent>;
const Player = z.enum(PLAYER);
type Player = z.infer<typeof Player>;

type Round = readonly [opponent: Opponent, player: Player];
type Strategy = ReadonlyArray<Round>;

const schema = LinesSchema(
    z
        .string()
        .transform((line) => line.split(" "))
        .pipe(z.tuple([Opponent, Player])),
);

const Shape = {
    [Player.enum.X]: 1,
    [Player.enum.Y]: 2,
    [Player.enum.Z]: 3,
} as const;

const score = (opponent: Opponent, player: Player): number => {
    const oIndex = OPPONENT.indexOf(opponent);
    const pIndex = PLAYER.indexOf(player);
    if (oIndex === pIndex) {
        return 3;
    }
    if ((oIndex + 1) % OPPONENT.length === pIndex) {
        return 6;
    }
    return 0;
};

const toMove = (opponent: Opponent, player: Player): Player => {
    const oIndex = OPPONENT.indexOf(opponent);
    const move = ((): number => {
        switch (player) {
            case Player.enum.X: {
                return oIndex === 0 ? 2 : oIndex - 1;
            }
            case Player.enum.Y: {
                return oIndex;
            }
            case Player.enum.Z: {
                return (oIndex + 1) % 3;
            }
        }
    })();
    return PLAYER[move];
};

const part1 = (strategy: Strategy): number =>
    strategy.reduce(
        (sum, [opponent, player]) =>
            sum + score(opponent, player) + Shape[player],
        0,
    );

const part2 = (strategy: Strategy): number =>
    strategy.reduce((sum, [opponent, player]) => {
        const move = toMove(opponent, player);
        return sum + score(opponent, move) + Shape[move];
    }, 0);

main(module, (input) => schema.parse(input), part1, part2);
