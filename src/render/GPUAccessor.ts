import { GPUBufferView } from "./GPUBufferView.js";


export interface GPUAccessor {
    count: number
    view: GPUBufferView
    byteStride: number
    vertexType: GPUVertexFormat
}
