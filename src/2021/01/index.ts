import { main } from "../../utils/host";
import { IntSchema, LinesSchema } from "../../utils/schemas";

const schema = LinesSchema(IntSchema);

const increasing = (values: ReadonlyArray<number>): number =>
    values.reduce((sum, value, index) => {
        if (index > 0 && value > values[index - 1]) {
            sum += 1;
        }
        return sum;
    }, 0);

const part1 = (depths: ReadonlyArray<number>): number => increasing(depths);

const part2 = (depths: ReadonlyArray<number>): number =>
    increasing(
        Array.from(
            {
                length: depths.length - 2,
            },
            (_, index) => {
                let sum = 0;
                for (let i = 0; i < 3; i++) {
                    sum += depths[index + i];
                }
                return sum;
            },
        ),
    );

main(module, (input) => schema.parse(input), part1, part2);
