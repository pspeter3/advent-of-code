import { main, readInput } from "../../utils/host";

const increasing = (values: Uint16Array): number =>
    values.reduce((sum, value, index) => {
        if (index > 0 && value > values[index - 1]) {
            sum += 1;
        }
        return sum;
    }, 0);

const part1 = (depths: Uint16Array) => (): number => increasing(depths);

const part2 = (depths: Uint16Array) => (): number => {
    const windows = Uint16Array.from(
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
    );
    return increasing(windows);
};

main(module, async () => {
    const input = await readInput(__dirname);
    const lines = input.trim().split("\n");
    const depths = Uint16Array.from(lines, (line, index) => {
        const value = parseInt(line);
        if (Number.isNaN(value)) {
            throw new Error(`Invalid line ${index + 1}: ${line}`);
        }
        return value;
    });
    return [part1(depths), part2(depths)];
});
