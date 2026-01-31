// © 2026 Adobe. MIT License. See /LICENSE for details.
import { describe, it, expect } from "vitest";
import { packColumnInfo, unpackColumnInfo, isEmptyColumn, EMPTY_COLUMN } from "./column-info.js";

describe("ColumnInfo", () => {
    describe("packColumnInfo", () => {
        it("should pack values correctly", () => {
            const info = packColumnInfo(100, 15, 5);
            expect(info).toBe((100 << 16) | (15 << 8) | 5);
        });

        it("should handle boundary values", () => {
            expect(packColumnInfo(0, 0, 0)).toBe(0);
            expect(packColumnInfo(65535, 255, 255)).toBe((65535 << 16) | (255 << 8) | 255);
        });

        it("should throw for out of range dataOffset", () => {
            expect(() => packColumnInfo(-1, 0, 0)).toThrow("Data offset -1 is out of range");
            expect(() => packColumnInfo(65536, 0, 0)).toThrow("Data offset 65536 is out of range");
        });

        it("should throw for out of range length", () => {
            expect(() => packColumnInfo(0, -1, 0)).toThrow("Length -1 is out of range");
            expect(() => packColumnInfo(0, 256, 0)).toThrow("Length 256 is out of range");
        });

        it("should throw for out of range zStart", () => {
            expect(() => packColumnInfo(0, 0, -1)).toThrow("Z start -1 is out of range");
            expect(() => packColumnInfo(0, 0, 256)).toThrow("Z start 256 is out of range");
        });
    });

    describe("unpackColumnInfo", () => {
        it("should unpack values correctly", () => {
            const packed = packColumnInfo(100, 15, 5);
            const unpacked = unpackColumnInfo(packed);
            expect(unpacked).toEqual({ dataOffset: 100, length: 15, zStart: 5 });
        });

        it("should handle boundary values", () => {
            const unpacked1 = unpackColumnInfo(packColumnInfo(0, 0, 0));
            expect(unpacked1).toEqual({ dataOffset: 0, length: 0, zStart: 0 });

            const unpacked2 = unpackColumnInfo(packColumnInfo(65535, 255, 255));
            expect(unpacked2).toEqual({ dataOffset: 65535, length: 255, zStart: 255 });
        });

        it("should round-trip correctly", () => {
            const testCases = [
                { dataOffset: 0, length: 0, zStart: 0 },
                { dataOffset: 100, length: 15, zStart: 5 },
                { dataOffset: 65535, length: 255, zStart: 255 },
                { dataOffset: 12345, length: 42, zStart: 99 },
            ];
            for (const testCase of testCases) {
                const packed = packColumnInfo(testCase.dataOffset, testCase.length, testCase.zStart);
                const unpacked = unpackColumnInfo(packed);
                expect(unpacked).toEqual(testCase);
            }
        });
    });

    describe("isEmptyColumn", () => {
        it("should return true for EMPTY_COLUMN", () => {
            expect(isEmptyColumn(EMPTY_COLUMN)).toBe(true);
        });

        it("should return false for valid column info", () => {
            const info = packColumnInfo(0, 0, 0);
            expect(isEmptyColumn(info)).toBe(false);
        });

        it("should return false for non-empty columns", () => {
            const info = packColumnInfo(100, 15, 5);
            expect(isEmptyColumn(info)).toBe(false);
        });
    });
});

