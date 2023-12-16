import assert from "assert/strict";
import { describe, it } from "node:test";
import {
    enumerate,
    filter,
    groupBy,
    map,
    max,
    min,
    reduce,
    sum,
    zip,
} from "./itertools";

describe("sum", () => {
    it("should calculate the sum of numbers", () => {
        assert.equal(sum([1, 2, 3]), 6);
    });
});

describe("max", () => {
    it("should calculate the max of numbers", () => {
        assert.equal(max([1, 2, 3]), 3);
    });
});

describe("min", () => {
    it("should calculate the min of numbers", () => {
        assert.equal(min([1, 2, 3]), 1);
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
    it("should filter items", () => {
        assert.deepEqual(Array.from(filter([1, 2, 3], (n) => n % 2 === 0)), [
            2,
        ]);
    });
});

describe("reduce", () => {
    it("should reduce items", () => {
        assert.equal(
            reduce([1, 2, 3], (sum, item) => sum + item, 0),
            6,
        );
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

describe("enumerate", () => {
    it("should create an enumeration", () => {
        assert.deepEqual(Array.from(enumerate("abc")), [
            [0, "a"],
            [1, "b"],
            [2, "c"],
        ]);
    });
});
