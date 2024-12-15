import { expect, test } from "vitest";
import { Context } from "./context-types.js";

// add an empty vitest test
test("context type tests", () => {
    expect(true).toBe(true);

    //  Sample Context Usage.
    let base!: Context;
    async function firstShader() {
        const c = await base.withGraphicShaders({
            my_shader: {
                attributes: {
                    position: "vec3",
                    color: "vec4"
                },
                uniforms: {
                    time: "f32",
                    ambientColor: "vec3",
                },
                source: ""
            }
        });

        const vertexBuffer = c.shaders.my_shader.createVertexBuffer([
            0, 0, 0, 1, 0, 0,
            1, 0, 0, 0, 1, 0,
            0, 1, 0, 0, 0, 1,
        ]);

        const drawCommand = c.shaders.my_shader.draw({
            uniforms: {
                time: 0,
                ambientColor: [0.1, 0.1, 0.1],
            },
            resources: {},
            vertexBuffer,
            vertexCount: 1,
        });

        c.executeCommands([drawCommand]);
    }

    async function firstTriangle(b: Context) {
        const c = await b.withGraphicShaders({
            my_shader: {
                attributes: { position: "vec3", color: "vec4" },
                source: ""
            }
        });
        const vertexBuffer = c.shaders.my_shader.createVertexBuffer([
            1, -1, 0,    1, 1, 0, 0,
            -1, -1, 0,   1, 0, 1, 0,
            0, 1, 0,     1, 0, 0, 1,
        ]);
        const drawCommand = c.shaders.my_shader.draw({
            uniforms: {},
            resources: {},
            vertexBuffer,
            vertexCount: 3,
        });

        return {
            render() {
                return drawCommand;
            },
            dispose() {
                vertexBuffer.destroy();
            }
        };
    }
});
