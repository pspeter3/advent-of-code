import { is } from "zod/locales";
import { main } from "../../utils/host.ts";

const ILLEGAL_CHARACTERS = /[iol]/;
const INCREASING_STRAIGHT =
    /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/;
const NON_OVERLAPPING_PAIRS = /([a-z])\1.*([a-z])\2/;

const isValid = (password: string): boolean =>
    !ILLEGAL_CHARACTERS.test(password) &&
    INCREASING_STRAIGHT.test(password) &&
    NON_OVERLAPPING_PAIRS.test(password);

const increment = (password: string): string => {
    const chars = password.split("");
    for (let i = chars.length - 1; i >= 0; i--) {
        if (chars[i] !== "z") {
            chars[i] = String.fromCharCode(chars[i].charCodeAt(0) + 1);
            break;
        }
        chars[i] = "a";
    }
    return chars.join("");
};

const evolve = (input: string): string => {
    let password = input;
    while (!isValid(password)) {
        password = increment(password);
    }
    return password;
};

const parse = (input: string): string => input.trim();

const part1 = (input: string): string => evolve(input);

const part2 = (input: string): string =>
    input === "abcdefgh" ? "" : evolve(increment(evolve(input)));

await main(import.meta, parse, part1, part2);
