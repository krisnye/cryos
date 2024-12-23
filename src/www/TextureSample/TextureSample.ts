import textureUrl from "./f.png";
import { GraphicShaderDescriptor } from "../../types/shader-types.js";
import { NewSampleCanvas } from "../NewSampleCanvas.js";
import { Context } from "../../types/context-types.js";
import { loadTexture } from "../../functions/load-texture.js";

const textureShader = {
    attributes: {
        position: "vec4",
        texcoord: "vec2",
    },
    samplers: {
        ourSampler: "sampler",
    },
    textures: {
        ourTexture: "texture_2d",
    },
    source: `
struct VertexOutput {
    // The builtin position attribute is passed the transformed position
    @builtin(position) position: vec4<f32>,
    @location(0) texcoord: vec2<f32>,
};

@vertex
fn vertex_main(vert: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = vert.position;
    out.texcoord = vert.texcoord;
    return out;
};

@fragment
fn fragment_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return textureSample(ourTexture, ourSampler, in.texcoord);
}
`
} as const satisfies GraphicShaderDescriptor;

export function TextureSample() {
    return NewSampleCanvas({
        create: async (_c: Context) => {
            const c = await _c.withGraphicShaders({
                textureShader,
            });

            const s = 0.9
            const vertexBuffer = c.shaders.textureShader.createVertexBuffer(
                [
                    //  x, y, z, u, v
                    s, -s, 0, 1, 1, -1,
                    -s, -s, 0, 1, -1, -1,
                    -s, s, 0, 1, -1, 1,
                    -s, s, 0, 1, -1, 1,
                    s, s, 0, 1, 1, 1,
                    s, -s, 0, 1, 1, -1,
                ]
            );

            const ourTexture = await loadTexture(c, textureUrl);
            const ourSampler = c.device.createSampler();

            const draw = c.shaders.textureShader.draw({
                vertexBuffer,
                vertexCount: 6,
                resources: {
                    ourTexture,
                    ourSampler,
                }
            });

            return {
                render() {
                    c.executeCommands([draw]);
                },
                destroy() {
                    vertexBuffer.destroy();
                    ourTexture.destroy();
                }
            };
        }
    })
}
