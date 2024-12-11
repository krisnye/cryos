import { VertexAttributes } from "../types/resource-types.js";
import { sizeOf } from "./size-of.js";
import { toGPUVertexFormat } from "./to-gpu-vertex-format.js";


export function toGPUVertexBufferLayout(attributes: VertexAttributes): GPUVertexBufferLayout {
    const vertexAttributes: GPUVertexAttribute[] = [];
    let arrayStride = 0;

    for (const type of Object.values(attributes)) {
        vertexAttributes.push({
            format: toGPUVertexFormat(type),
            offset: arrayStride,
            shaderLocation: vertexAttributes.length
        });
        arrayStride += sizeOf(type);
    }

    return {
        arrayStride,
        attributes: vertexAttributes,
        stepMode: 'vertex'
    };
}
