import { describe, it, expect } from "vitest";
import { ColumnInfo } from "./column-info/column-info.js";

describe("ColumnInfo", () => {
    describe("pack", () => {
        it("should pack values correctly", () => {
            const info = ColumnInfo.pack(100, 15, 5);
            expect(info).toBe((100 << 16) | (15 << 8) | 5);
        });

        it("should handle boundary values", () => {
            expect(0).toBe(0);
            expect(ColumnInfo.pack(65535, 255, 255)).toBe((65535 << 16) | (255 << 8) | 255);
        });

        it("should throw for out of range dataOffset", () => {
            expect(() => ColumnInfo.pack(-1, 0, 0)).toThrow("Data offset -1 is out of range");
            expect(() => ColumnInfo.pack(65536, 0, 0)).toThrow("Data offset 65536 is out of range");
        });

        it("should throw for out of range length", () => {
            expect(() => ColumnInfo.pack(0, -1, 0)).toThrow("Length -1 is out of range");
            expect(() => ColumnInfo.pack(0, 256, 0)).toThrow("Length 256 is out of range");
        });

        it("should throw for out of range zStart", () => {
            expect(() => ColumnInfo.pack(0, 0, -1)).toThrow("Z start -1 is out of range");
            expect(() => ColumnInfo.pack(0, 0, 256)).toThrow("Z start 256 is out of range");
        });
    });

    describe("unpack", () => {
        it("should unpack values correctly", () => {
            const packed = ColumnInfo.pack(100, 15, 5);
            const unpacked = ColumnInfo.unpack(packed);
            expect(unpacked).toEqual({ dataOffset: 100, length: 15, zStart: 5 });
        });

        it("should handle boundary values", () => {
            const unpacked1 = ColumnInfo.unpack(0);
            expect(unpacked1).toEqual({ dataOffset: 0, length: 0, zStart: 0 });

            const unpacked2 = ColumnInfo.unpack(ColumnInfo.pack(65535, 255, 255));
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
                const packed = ColumnInfo.pack(testCase.dataOffset, testCase.length, testCase.zStart);
                const unpacked = ColumnInfo.unpack(packed);
                expect(unpacked).toEqual(testCase);
            }
        });
    });

    describe("empty columns", () => {
        it("should treat length=0 as empty when unpacking", () => {
            expect(ColumnInfo.unpack(0).length).toBe(0);
            expect(ColumnInfo.unpack(ColumnInfo.pack(100, 0, 0)).length).toBe(0); // dataOffset doesn't matter
            expect(ColumnInfo.unpack(ColumnInfo.pack(0, 0, 5)).length).toBe(0); // zStart doesn't matter
        });
    });
});

