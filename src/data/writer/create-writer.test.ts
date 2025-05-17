import { describe, it, expect } from "vitest";
import { createList } from "./create-writer";
import { createTypedBuffer } from "../typed-buffer";
import { F32Schema } from "../f32";
import { Schema } from "../schema";

describe("Writer", () => {
    describe("number buffer", () => {
        it("should write values and track count", () => {
            const buffer = createTypedBuffer({ schema: F32Schema });
            const writer = createList(buffer);

            expect(writer.count).toBe(0);
            writer.write(42);
            expect(writer.count).toBe(1);
            expect(buffer.get(0)).toBe(42);
        });

        it("should grow buffer when needed", () => {
            const buffer = createTypedBuffer({ schema: F32Schema, length: 2 });
            const writer = createList(buffer);

            // Write more than initial size
            writer.write(1);
            writer.write(2);
            writer.write(3);
            writer.write(4);

            expect(writer.count).toBe(4);
            expect(buffer.size).toBeGreaterThanOrEqual(4);
            expect(buffer.get(0)).toBe(1);
            expect(buffer.get(1)).toBe(2);
            expect(buffer.get(2)).toBe(3);
            expect(buffer.get(3)).toBe(4);
        });

        it("should reset count to 0", () => {
            const buffer = createTypedBuffer({ schema: F32Schema });
            const writer = createList(buffer);

            writer.write(1);
            writer.write(2);
            expect(writer.count).toBe(2);
            
            writer.reset();
            expect(writer.count).toBe(0);
            
            // Should be able to write after reset
            writer.write(3);
            expect(writer.count).toBe(1);
            expect(buffer.get(0)).toBe(3);
        });

        it("should grow by minimum size when needed", () => {
            const buffer = createTypedBuffer({ schema: F32Schema, length: 1 });
            const writer = createList(buffer);

            // Write more than initial size to force growth
            for (let i = 0; i < 20; i++) {
                writer.write(i);
            }

            expect(writer.count).toBe(20);
            expect(buffer.size).toBeGreaterThanOrEqual(20);
            
            // Verify all values were written correctly
            for (let i = 0; i < 20; i++) {
                expect(buffer.get(i)).toBe(i);
            }
        });
    });

    describe("array buffer", () => {
        const stringArraySchema: Schema = {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 2
        } as const;

        const objectArraySchema: Schema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: { type: "number", precision: 1 },
                    name: { type: "string" }
                }
            },
            minItems: 2,
            maxItems: 2
        } as const;

        it("should handle string array values", () => {
            const buffer = createTypedBuffer({ schema: stringArraySchema });
            const writer = createList(buffer);

            const arr1 = ["hello", "world"];
            const arr2 = ["test", "array"];

            writer.write(arr1);
            writer.write(arr2);

            expect(writer.count).toBe(2);
            expect(buffer.get(0)).toEqual(arr1);
            expect(buffer.get(1)).toEqual(arr2);
        });

        it("should handle object array values", () => {
            const buffer = createTypedBuffer({ schema: objectArraySchema });
            const writer = createList(buffer);

            const arr1 = [{ id: 1, name: "test1" }, { id: 2, name: "test2" }];
            const arr2 = [{ id: 3, name: "test3" }, { id: 4, name: "test4" }];

            writer.write(arr1);
            writer.write(arr2);

            expect(writer.count).toBe(2);
            expect(buffer.get(0)).toEqual(arr1);
            expect(buffer.get(1)).toEqual(arr2);
        });
    });
}); 