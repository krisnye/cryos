
import { ComputeShaderDescriptor, GraphicShaderDescriptor, ShaderResourceValues, ShaderVertexBuffer } from "./shader-types.js";
import { EmptyToNever, Simplify } from "./meta-types.js";
import { StorageBuffer, VertexAttributes } from "./resource-types.js";
import { TupleType } from "./data-types.js";

export type ComputeShader<C extends ComputeShaderDescriptor> = {
  descriptor: C,
  compute: (
      resources: EmptyToNever<ShaderResourceValues<C>>,
      dispatchCountX: number,
      dispatchCountY?: number,
      dispatchCountZ?: number
  ) => ComputeCommand<C>
};
export type GraphicShader<G extends GraphicShaderDescriptor> = {
  descriptor: G,
  draw: (
      resources: EmptyToNever<ShaderResourceValues<G>>,
      vertexBuffer: ShaderVertexBuffer<G>,
      vertexCount: number,
      instanceCount?: number
  ) => DrawCommand<G>,
  createVertexBuffer: G["attributes"] extends VertexAttributes ? (data: number[]) => ShaderVertexBuffer<G> : undefined;
};

export interface Context<GS extends Record<string, GraphicShaderDescriptor> = {}, CS extends Record<string, ComputeShaderDescriptor> = {}> {
    readonly canvas: HTMLCanvasElement;
    readonly device: GPUDevice;
    readonly canvasContext: GPUCanvasContext;
    readonly depthTexture: GPUTexture;
    readonly shaders: Simplify<{ [K in keyof GS]: GraphicShader<GS[K]> } & { [K in keyof CS]: ComputeShader<CS[K]> }>;
    createStorageBuffer<T extends TupleType>(props: { type: T, data: number[], dynamic?: boolean }): StorageBuffer<T>;
    createTexture(source: ImageBitmapSource | string): Promise<GPUTexture>;
    withGraphicShaders<S extends Record<string, GraphicShaderDescriptor>>(shaders: S): Promise<Context<Simplify<GS & S>, CS>>;
    withComputeShaders<S extends Record<string, ComputeShaderDescriptor>>(shaders: S): Promise<Context<GS, Simplify<CS & S>>>;
    executeCommands(commands: (ComputeCommand<CS[keyof CS]> | DrawCommand<GS[keyof GS]>)[]): Promise<void>;
}

export interface ComputeCommand<C extends ComputeShaderDescriptor> {
    shaderName: string;
    resources: ShaderResourceValues<C>;
    dispatchCount: [number, number, number];
}

export interface DrawCommand<G extends GraphicShaderDescriptor> {
    shaderName: string;
    resources: ShaderResourceValues<G>;
    vertexBuffer?: ShaderVertexBuffer<G>;
    vertexCount?: number;
    instanceCount?: number;
}

export function isDrawCommand(command: ComputeCommand<ComputeShaderDescriptor> | DrawCommand<GraphicShaderDescriptor>): command is DrawCommand<GraphicShaderDescriptor> {
    const partial = command as Partial<DrawCommand<GraphicShaderDescriptor>>;
    return partial.vertexBuffer !== undefined;
}

export function isComputeCommand(command: ComputeCommand<ComputeShaderDescriptor> | DrawCommand<GraphicShaderDescriptor>): command is ComputeCommand<ComputeShaderDescriptor> {
    const partial = command as Partial<ComputeCommand<ComputeShaderDescriptor>>;
    return partial.dispatchCount !== undefined;
}

