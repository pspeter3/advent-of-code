import assert from "assert/strict";
import { describe, it } from "node:test";
import { filter, groupBy, map, sum, zip } from "./itertools";

describe("sum", () => {
    it("should calculate the sum of numbers", () => {
        assert.equal(sum([1, 2, 3]), 6);
    });
});

describe("zip", () => {
    it("should zip the entries", () => {
        assert.deepEqual(Object.fromEntries(zip(["a", "b", "c"], [0, 1, 2])), {
            a: 0,
            b: 1,
            c: 2,
        });
    });
});

describe("map", () => {
    it("should map the items", () => {
        assert.deepEqual(Array.from(map([1, 2, 3], (n) => 2 * n)), [2, 4, 6]);
    });
});

describe("filter", () => {
    it("should filter elements", () => {
        assert.deepEqual(Array.from(filter([1, 2, 3], (n) => n % 2 === 0)), [
            2,
        ]);
    });
});

describe("groupBy", () => {
    it("should create a group", () => {
        assert.deepEqual(
            groupBy([1, 2, 3], (n) => n % 2),
            new Map([
                [0, [2]],
                [1, [1, 3]],
            ]),
        );
    });
});
