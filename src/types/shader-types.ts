import { DataType, FromDataType, Vec4, Vec3 } from "./data-types.js";
import { FlattenProperties, Simplify } from "./meta-types.js";
import { VertexType, SamplerType, StorageBuffer, TextureType, VertexAttributes, VertexBuffer } from "./resource-types.js";
import { IsEquivalent, IsTrue } from "./test-types.js";

////////////////////////////////////////////////////////////////////////////////
// Shader Types
////////////////////////////////////////////////////////////////////////////////

/**
 * A declarative descriptor for a graphic shader inputs.
 * We will do some simple parsing of the shader looking for vertex_main and fragment_main.
 * Based upon the uniforms, textures, samplers and storage variables
 * referenced within we will make the variables available to the correct shader stages.
 */
export type GraphicShaderDescriptor = {
  /**
   * The attributes of the vertex buffer if present.
   */
  attributes?: Record<string, VertexType>;
  /**
   * The uniforms used by the either the vertex or fragment shader.
   * Each of these will have its own BindGroup.
   */
  uniforms?: Record<string, DataType>;
  /**
   * The textures used by the either the vertex or fragment shader.
   * Each of these will have its own BindGroup.
   */
  textures?: Record<string, TextureType>;
  /**
   * The samplers used by the either the vertex or fragment shader.
   * Each of these will have its own BindGroup.
   */
  samplers?: Record<string, SamplerType>;
  /**
   * The storage buffers used by the either the vertex or fragment shader.
   * Each of these will have its own BindGroup.
   */
  storage?: Record<string, DataType>;
  /**
   * The source code of the shader.
   * Does NOT include any bound resource declarations.
   * The bound resources will be generated at runtime based on this declaration.
   */
  source: string;
};

export type ComputeShaderDescriptor = {
  input: {
    workgroup_size?: readonly [number, number, number];
    uniforms?: Record<string, DataType>;
    storage?: Record<string, DataType>;
  };
  output: {
    storage?: Record<string, DataType>;
  };
  source: string;
};

export type ShaderDescriptor = ComputeShaderDescriptor | GraphicShaderDescriptor;

export type ResourceTypes = {
  uniforms?: Record<string, DataType>;
  textures?: Record<string, TextureType>;
  samplers?: Record<string, SamplerType>;
  storage?: Record<string, DataType>;
}

type ShaderUniformTypes<T> = T extends GraphicShaderDescriptor ?
  T["uniforms"]
 : T extends ComputeShaderDescriptor ?
  FlattenProperties<Pick<T["input"], "uniforms">>
  : never;

type ShaderTextureTypes<T> = T extends GraphicShaderDescriptor ?
  T["textures"]
  : never;

type ShaderSamplerTypes<T> = T extends GraphicShaderDescriptor ?
  T["samplers"]
  : never;

type ShaderStorageTypes<T> = T extends GraphicShaderDescriptor ?
  T["storage"]
  : never;

export type ShaderVertexBuffer<T> = T extends GraphicShaderDescriptor ?
  T["attributes"] extends VertexAttributes ? VertexBuffer<T["attributes"]> : never
  : never;

export type ShaderUniformValues<T> =
  { [K in keyof ShaderUniformTypes<T>]: FromDataType<ShaderUniformTypes<T>[K]> };

/**
 * Returns the required ResourceTypes for a given ShaderDescriptor.
 */
export type ShaderResourceValues<T> = Simplify<
  & { [K in keyof ShaderTextureTypes<T>]: GPUTexture }
  & { [K in keyof ShaderSamplerTypes<T>]: GPUSampler }
  & { [K in keyof ShaderStorageTypes<T>]: StorageBuffer<ShaderStorageTypes<T>[K]> }
>;

{
  //  type compile time unit tests
  const sampleGraphicsShaderDescriptor = {
    attributes: { position: "vec3", color: "vec4", },
    uniforms: { time: "f32", light: "vec4", gravity: "vec3" },
    textures: { texture1: "texture_2d", texture2: "texture_2d" },
    samplers: { sampler1: "sampler", sampler2: "sampler_comparison" },
    storage: { storage1: "vec4", storage2: ["vec4", 200] },
    source: "sample-shader",
  } as const satisfies GraphicShaderDescriptor;
  
  type SampleShaderUniformTypes = ShaderUniformTypes<typeof sampleGraphicsShaderDescriptor>;
  type CheckUniformTypes = IsTrue<IsEquivalent<SampleShaderUniformTypes, { time: "f32", light: "vec4", gravity: "vec3" }>>;
  type SampleShaderTextureTypes = ShaderTextureTypes<typeof sampleGraphicsShaderDescriptor>;
  type CheckTextureTypes = IsTrue<IsEquivalent<SampleShaderTextureTypes, { texture1: "texture_2d", texture2: "texture_2d" }>>;
  type SampleShaderSamplerTypes = ShaderSamplerTypes<typeof sampleGraphicsShaderDescriptor>;
  type CheckSamplerTypes = IsTrue<IsEquivalent<SampleShaderSamplerTypes, { sampler1: "sampler", sampler2: "sampler_comparison" }>>;
  type SampleShaderStorageTypes = ShaderStorageTypes<typeof sampleGraphicsShaderDescriptor>;
  type CheckStorageTypes = IsTrue<IsEquivalent<SampleShaderStorageTypes, { storage1: "vec4", storage2: readonly ["vec4", 200] }>>;
  type SampleShaderUniformValues = ShaderUniformValues<typeof sampleGraphicsShaderDescriptor>;
  type CheckUniformValues = IsTrue<IsEquivalent<SampleShaderUniformValues, { time: number, light: Vec4, gravity: Vec3 }>>;
  type SampleShaderResourceValues = ShaderResourceValues<typeof sampleGraphicsShaderDescriptor>;
  type CheckResourceValues = IsTrue<IsEquivalent<SampleShaderResourceValues, { texture1: GPUTexture, texture2: GPUTexture, sampler1: GPUSampler, sampler2: GPUSampler, storage1: {}, storage2: {} }>>;
}