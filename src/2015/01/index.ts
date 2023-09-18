import z from "zod";
import { main } from "../../utils/host";

enum FloorDirection {
    Up = "(",
    Down = ")",
}

const DirectionsSchema = z
    .string()
    .transform((value) => value.split(""))
    .pipe(z.array(z.nativeEnum(FloorDirection)));

const parse = (input: string): ReadonlyArray<FloorDirection> =>
    DirectionsSchema.parse(input);

const part1 = (input: ReadonlyArray<FloorDirection>): number =>
    input.reduce((a, e) => {
        switch (e) {
            case FloorDirection.Up:
                return a + 1;
            case FloorDirection.Down:
                return a - 1;
        }
    }, 0);

const part2 = (input: ReadonlyArray<FloorDirection>): number => {
    let current = 0;
    for (const [index, direction] of input.entries()) {
        switch (direction) {
            case FloorDirection.Up: {
                current++;
                break;
            }
            case FloorDirection.Down: {
                current--;
                break;
            }
        }
        if (current === -1) {
            return index + 1;
        }
    }
    return 0;
};

main(module, parse, part1, part2);
