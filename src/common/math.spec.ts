import assert from "assert/strict";
import { describe, it } from "node:test";
import { toTriangle } from "./math";

describe("toTriangle", () => {
    it("should support common triangle numbers", () => {
        assert.equal(toTriangle(1), 1);
        assert.equal(toTriangle(2), 3);
        assert.equal(toTriangle(3), 6);
        assert.equal(toTriangle(4), 10);
    });
});
