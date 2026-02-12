import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fromCantor,
  fromZigZag,
  greatestCommonDivisor,
  leastCommonMultiple,
  mod,
  toCantor,
  toTriangle,
  toZigZag,
} from "./math.ts";

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

describe("cantor", () => {
  it("should invert", () => {
    assert.equal(fromZigZag(toZigZag(2)), 2);
    assert.equal(fromZigZag(toZigZag(-2)), -2);
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

describe("mod", () => {
  it("should work for positive numbers", () => {
    assert.equal(mod(1, 8), 1);
    assert.equal(mod(9, 8), 1);
  });

  it("should work for negative numbers", () => {
    assert.equal(mod(-1, 8), 7);
    assert.equal(mod(-9, 8), 7);
  });
});
