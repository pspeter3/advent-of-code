import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enumerate, len, max, min, sum, zip } from "./itertools";

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

describe("enumerate", () => {
    it("should create an enumeration", () => {
        assert.deepEqual(Array.from(enumerate("abc")), [
            [0, "a"],
            [1, "b"],
            [2, "c"],
        ]);
    });
});

describe("len", () => {
    it("should count the length", () => {
        assert.equal(len("foo"), 3);
    });
});
