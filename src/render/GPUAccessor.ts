import { GPUBufferView } from "./GPUBufferView.js";


export interface GPUAccessor {
    count: number;
    view: GPUBufferView;
    byteOffset: number;
    byteStride: number;
    byteLength: number;
    vertexType: GPUVertexFormat;
}
