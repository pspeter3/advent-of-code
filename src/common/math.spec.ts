import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    fromCantor,
    greatestCommonDivisor,
    leastCommonMultiple,
    toCantor,
    toTriangle,
} from "./math";

describe("toTriangle", () => {
    it("should support common triangle numbers", () => {
        assert.equal(toTriangle(1), 1);
        assert.equal(toTriangle(2), 3);
        assert.equal(toTriangle(3), 6);
        assert.equal(toTriangle(4), 10);
    });
});

describe("cantor", () => {
    it("should invert", () => {
        assert.deepEqual(fromCantor(toCantor(1, 3)), [1, 3]);
        assert.deepEqual(fromCantor(toCantor(3, 4)), [3, 4]);
    });
});

describe("greatestCommonDivisor", () => {
    it("should work for Wikipedia examples", () => {
        assert.equal(greatestCommonDivisor(54, 24), 6);
        assert.equal(greatestCommonDivisor(42, 56), 14);
    });
});

describe("leastCommonMultiple", () => {
    it("should work for Wikipedia examples", () => {
        assert.equal(leastCommonMultiple(21, 6), 42);
    });
});
