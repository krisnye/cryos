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
                vertex: {
                    attributes: {
                        position: "vec3",
                        color: "vec4"
                    },
                    uniforms: {
                        time: "f32",
                        ambientColor: "vec3",
                    }
                },
                fragment: {
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
            time: 0,
            ambientColor: [0.1, 0.1, 0.1],
        }, vertexBuffer, 1);

        c.executeCommands([drawCommand]);
    }

    async function firstTriangle(b: Context) {
        const c = await b.withGraphicShaders({
            my_shader: {
                vertex: { attributes: { position: "vec3", color: "vec4" } },
                fragment: { },
                source: ""
            }
        });
        const vertexBuffer = c.shaders.my_shader.createVertexBuffer([
            1, -1, 0,    1, 1, 0, 0,
            -1, -1, 0,   1, 0, 1, 0,
            0, 1, 0,     1, 0, 0, 1,
        ]);
        const drawCommand = c.shaders.my_shader.draw({}, vertexBuffer, 3);

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
