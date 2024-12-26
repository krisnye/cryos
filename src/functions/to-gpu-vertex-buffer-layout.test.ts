import { expect, test, describe } from "vitest";
import { toGPUVertexBufferLayout } from "./to-gpu-vertex-buffer-layout.js";
import { VertexAttributes } from "../types/resource-types.js";

describe("toGPUVertexBufferLayout", () => {
    test("should create layout for single attribute", () => {
        const attributes: VertexAttributes = {
            position: "vec3"
        };

        const layout = toGPUVertexBufferLayout(attributes);

        expect(layout.arrayStride).toBe(16); // vec3 is 16-byte aligned
        expect(layout.attributes).toHaveLength(1);
        expect(layout.attributes[0]).toEqual({
            format: "float32x3",
            offset: 0,
            shaderLocation: 0
        });
        expect(layout.stepMode).toBe("vertex");
    });

    test("should create layout for multiple attributes", () => {
        const attributes: VertexAttributes = {
            position: "vec3",
            color: "vec4",
            texCoord: "vec2"
        };

        const layout = toGPUVertexBufferLayout(attributes);

        expect(layout.arrayStride).toBe(40); // vec3(16) + vec4(16) + vec2(8)
        expect(layout.attributes).toHaveLength(3);

        // Position attribute
        expect(layout.attributes[0]).toEqual({
            format: "float32x3",
            offset: 0,
            shaderLocation: 0
        });

        // Color attribute
        expect(layout.attributes[1]).toEqual({
            format: "float32x4",
            offset: 16, // After aligned vec3
            shaderLocation: 1
        });

        // TexCoord attribute
        expect(layout.attributes[2]).toEqual({
            format: "float32x2",
            offset: 32, // After vec4
            shaderLocation: 2
        });
    });

    test("should handle scalar types", () => {
        const attributes: VertexAttributes = {
            intensity: "f32",
            index: "i32"
        };

        const layout = toGPUVertexBufferLayout(attributes);

        expect(layout.arrayStride).toBe(8); // 2 * 4 bytes
        expect(layout.attributes).toHaveLength(2);

        expect(layout.attributes[0]).toEqual({
            format: "float32",
            offset: 0,
            shaderLocation: 0
        });

        expect(layout.attributes[1]).toEqual({
            format: "sint32",
            offset: 4,
            shaderLocation: 1
        });
    });

    test("should throw for invalid vertex type", () => {
        const attributes = {
            position: "invalid_type" as any
        };

        expect(() => toGPUVertexBufferLayout(attributes))
            .toThrow();
    });
}); 