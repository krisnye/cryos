import { describe, it, expect } from "vitest";
import { getStructLayout } from "./getStructLayout";
import type { Schema } from "../../Schema";
import { F32Schema } from "../../F32";
import { U32Schema } from "../../U32";
import { I32Schema } from "../../I32";
import { Vec3Schema } from "../../Vec3/Vec3";
import { Mat4x4Schema } from "../../Mat4x4/Mat4x4";
import { createReadStruct } from "./createReadStruct";
import { createWriteStruct } from "./createWriteStruct";

describe("getStructLayout", () => {
    it("should handle primitive types", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                a: F32Schema,
                b: U32Schema,
                c: I32Schema,
            }
        };

        const layout = getStructLayout(schema);
        expect(layout.type).toBe("object");
        expect(layout.size).toBe(16);  // rounded to vec4
        expect(layout.fields.a.offset).toBe(0);
        expect(layout.fields.b.offset).toBe(4);
        expect(layout.fields.c.offset).toBe(8);
    });

    it("should handle vec3 with proper padding", () => {
        const schema: Schema = {
            type: "array",
            items: { type: "number", precision: 1 },
            minItems: 3,
            maxItems: 3
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("array");
        expect(layout.size).toBe(16);  // padded to vec4
        expect(layout.fields["0"].offset).toBe(0);
        expect(layout.fields["1"].offset).toBe(4);
        expect(layout.fields["2"].offset).toBe(8);
    });

    it("should handle nested structs", () => {
        const schema: Schema = {
            type: "object",
            properties: {
                transform: {
                    type: "object",
                    properties: {
                        position: {
                            type: "array",
                            items: F32Schema,
                            minItems: 3,
                            maxItems: 3
                        },
                        scale: F32Schema
                    }
                },
                active: U32Schema
            }
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("object");
        // transform (32 bytes) + active (4 bytes) = 36 bytes
        // rounded up to largest member alignment (16 bytes) = 48 bytes
        expect(layout.size).toBe(48);
        
        const transform = layout.fields.transform.type;
        expect(typeof transform).not.toBe("string");
        if (typeof transform !== "string") {
            // position (vec3 = 16 bytes) + scale (4 bytes) = 20 bytes
            // rounded up to largest member alignment (16 bytes) = 32 bytes
            expect(transform.size).toBe(32);
            const position = transform.fields.position.type;
            expect(typeof position !== "string" && position.size).toBe(16);
        }
    });

    it("should handle array of structs", () => {
        const schema: Schema = {
            type: "array",
            items: {
                type: "object",
                properties: {
                    x: { type: "number", precision: 1 },
                    y: { type: "number", precision: 1 }
                }
            },
            minItems: 2,
            maxItems: 2
        };

        const layout = getStructLayout(schema)!;
        expect(layout.type).toBe("array");
        expect(layout.size).toBe(32);  // 2 structs aligned to vec4
        expect(layout.fields["0"].offset).toBe(0);
        expect(layout.fields["1"].offset).toBe(16);  // aligned to vec4
    });

    it("should reject invalid schemas", () => {
        // Non-fixed length array
        expect(() => getStructLayout({
            type: "array",
            items: { type: "number", precision: 1 }
        })).toThrow();

        // Invalid primitive type
        expect(() => getStructLayout({
            type: "object",
            properties: {
                a: { type: "string" }
            }
        })).toThrow();

        // Array length < 2
        expect(() => getStructLayout({
            type: "array",
            items: { type: "number", precision: 1 },
            minItems: 1,
            maxItems: 1
        })).toThrow();
    });

    // it("should handle advanced structs", () => {
    //     const SceneSchema = {
    //         type: 'object',
    //         properties: {
    //             viewProjection: Mat4x4Schema,
    //             lightDirection: Vec3Schema,
    //             ambientStrength: F32Schema,
    //             lightColor: Vec3Schema,
    //         }
    //     } as const satisfies Schema;
    //     const layout = getStructLayout(SceneSchema)!;
    //     const readFunction = createReadStruct(layout);
    //     const writeFunction = createWriteStruct(layout);
    //     console.log(JSON.stringify(layout, null, 2));
    //     console.log(readFunction.toString());
    //     console.log(writeFunction.toString());
    // });

}); 