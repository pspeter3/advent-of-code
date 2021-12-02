import { z } from "zod";
import { main } from "../../utils/host";

const schema = z.preprocess((value) => parseInt(value as string), z.number());

const setup = (input: string): Uint16Array =>
    Uint16Array.from(input.split("\n"), (line) => schema.parse(line));

const increasing = (values: Uint16Array): number =>
    values.reduce((sum, value, index) => {
        if (index > 0 && value > values[index - 1]) {
            sum += 1;
        }
        return sum;
    }, 0);

const part1 = (depths: Uint16Array): number => increasing(depths);

const part2 = (depths: Uint16Array): number =>
    increasing(
        Uint16Array.from(
            {
                length: depths.length - 2,
            },
            (_, index) => {
                let sum = 0;
                for (let i = 0; i < 3; i++) {
                    sum += depths[index + i];
                }
                return sum;
            }
        )
    );

main<Uint16Array, number>(module, { setup, part1, part2 });
