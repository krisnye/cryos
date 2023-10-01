
// const vertexFormatToSize = {
//     uint8x2: 2,
//     uint8x4: 4,
//     sint8x2: 2,
//     sint8x4: 4,
//     unorm8x2: 2,
//     unorm8x4: 4,
//     snorm8x2: 2,
//     snorm8x4: 4,
//     uint16x2: 4,
//     uint16x4: 8,
//     sint16x2: 4,
//     sint16x4: 8,
//     unorm16x2: 4,
//     unorm16x4: 8,
//     snorm16x2: 4,
//     snorm16x4: 8,
//     float16x2: 4,
//     float16x4: 8,
//     float32: 4,
//     float32x2: 8,
//     float32x3: 12,
//     float32x4: 16,
//     uint32: 4,
//     uint32x2: 8,
//     uint32x3: 12,
//     uint32x4: 16,
//     sint32: 4,
//     sint32x2: 8,
//     sint32x3: 12,
//     sint32x4: 16,
// } as const satisfies Record<GPUVertexFormat, number>

// export type GPUVertexAttributeNamed = GPUVertexAttribute & { name: string }
// export type GPUVertexBufferLayoutNamed = GPUVertexBufferLayout & { attributes: GPUVertexAttributeNamed[] }

// export function createVertexBufferLayout(properties: Record<string, GPUVertexFormat>): GPUVertexBufferLayoutNamed {

//     let arrayStride = 0
//     let attributes: GPUVertexAttributeNamed[] = []
//     for (let [name, format] of Object.entries(properties)) {
//         attributes.push({ format, offset: arrayStride, shaderLocation: attributes.length, name })
//         let size = vertexFormatToSize[format]
//         arrayStride += size
//     }

//     return { arrayStride, attributes }
// }
