import assert from "assert/strict";
import { describe, it } from "node:test";
import { sum } from "./itertools";

describe("sum", () => {
    it("should calculate the sum of numbers", () => {
        assert.equal(sum([1, 2, 3]), 6);
    });
});
