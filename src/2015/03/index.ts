import z from "zod";
import { main } from "../../utils/host";
import {
    CardinalDirection,
    GridVector2D,
    GridVector2DSet,
    InfiniteGrid2DCodec,
} from "../../common/grid2d";

const Directions = ["^", ">", "v", "<"] as const;
type CardinalDirectionList = ReadonlyArray<CardinalDirection>;

const CardinalDirectionListSchema = z
    .string()
    .transform((line) => line.trim().split(""))
    .pipe(z.array(z.enum(Directions)))
    .transform((directions) =>
        directions.map(
            (direction) => Directions.indexOf(direction) as CardinalDirection,
        ),
    );

const parse = (input: string): CardinalDirectionList =>
    CardinalDirectionListSchema.parse(input);

const part1 = (directions: CardinalDirectionList): number => {
    const positions = new GridVector2DSet(InfiniteGrid2DCodec);
    let current = new GridVector2D(0, 0);
    positions.add(current);
    for (const direction of directions) {
        current = current.neighbor(direction);
        positions.add(current);
    }
    return positions.size;
};

const part2 = (directions: CardinalDirectionList): number => {
    const positions = new GridVector2DSet(InfiniteGrid2DCodec);
    let santa = new GridVector2D(0, 0);
    let robot = new GridVector2D(0, 0);
    positions.add(santa);
    positions.add(robot);
    for (let i = 0; i < directions.length; i += 2) {
        santa = santa.neighbor(directions[i]);
        robot = robot.neighbor(directions[i + 1]);
        positions.add(santa);
        positions.add(robot);
    }
    return positions.size;
};

main(module, parse, part1, part2);
