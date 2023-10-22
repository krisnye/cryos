import { GPURenderPipelineProperties, GPUVertexAttributeNamed, GPUVertexBufferLayoutNamed, StringKeyOf, WGSLScalarType, WGSLType, WGSLVectorType } from "./types.js"

const vertexFormatToSize = {
    uint8x2: 2, uint8x4: 4,
    sint8x2: 2, sint8x4: 4,
    unorm8x2: 2, unorm8x4: 4, snorm8x2: 2, snorm8x4: 4,
    uint16x2: 4, uint16x4: 8, sint16x2: 4, sint16x4: 8,
    unorm16x2: 4, unorm16x4: 8, snorm16x2: 4, snorm16x4: 8,
    float16x2: 4, float16x4: 8,
    float32: 4, float32x2: 8, float32x3: 12, float32x4: 16,
    uint32: 4, uint32x2: 8, uint32x3: 12, uint32x4: 16,
    sint32: 4, sint32x2: 8, sint32x3: 12, sint32x4: 16,
} as const satisfies Record<GPUVertexFormat, number>

const vertexFormatToCount = {
    uint8x2: 2, uint8x4: 4,
    sint8x2: 2, sint8x4: 4,
    unorm8x2: 2, unorm8x4: 4, snorm8x2: 2, snorm8x4: 4,
    uint16x2: 2, uint16x4: 4, sint16x2: 2, sint16x4: 4,
    unorm16x2: 2, unorm16x4: 4, snorm16x2: 2, snorm16x4: 4,
    float16x2: 2, float16x4: 4,
    float32: 1, float32x2: 2, float32x3: 3, float32x4: 4,
    uint32: 1, uint32x2: 2, uint32x3: 3, uint32x4: 4,
    sint32: 1, sint32x2: 2, sint32x3: 3, sint32x4: 4,
} as const satisfies Record<GPUVertexFormat, number>

const vertexFormatToWGSLType = {
    uint8x2: "u32", uint8x4: "u32",
    sint8x2: "i32", sint8x4: "i32",
    unorm8x2: "u32", unorm8x4: "u32", snorm8x2: "u32", snorm8x4: "u32",     //  ?
    uint16x2: "u32", uint16x4: "u32", sint16x2: "u32", sint16x4: "u32",     //  ?
    unorm16x2: "u32", unorm16x4: "u32", snorm16x2: "u32", snorm16x4: "u32", //  ?
    float16x2: "f16", float16x4: "f16",
    float32: "f32", float32x2: "f32", float32x3: "f32", float32x4: "f32",
    uint32: "u32", uint32x2: "u32", uint32x3: "u32", uint32x4: "u32",
    sint32: "i32", sint32x2: "i32", sint32x3: "i32", sint32x4: "i32",
} as const satisfies Record<GPUVertexFormat, WGSLScalarType>

export const sizeof = {
    "bool": 1,
    "f16": 2,
    "f32": 4,
    "i32": 4,
    "u32": 4
} as const satisfies Record<WGSLScalarType, number>

export type Sizeof<T extends WGSLScalarType> = typeof sizeof[T]

export const elements = {
    "mat2x2": 4,
    "mat2x3": 6,
    "mat2x4": 8,
    "mat3x2": 6,
    "mat3x3": 9,
    "mat3x4": 12,
    "mat4x2": 8,
    "mat4x3": 12,
    "mat4x4": 16,
    "vec2": 2,
    "vec3": 3,
    "vec4": 4,
    "color": 4,
} as const satisfies Record<WGSLVectorType, number | undefined>

export type Elements<T extends WGSLVectorType> = typeof elements[T]

export function getWGSLSize(type: WGSLType) {
    return (elements[type] ?? 1) * sizeof.f32
}

export function toWGSLType(format: GPUVertexFormat): string {
    const count = vertexFormatToCount[format]
    const scalarType = vertexFormatToWGSLType[format]
    if (count === 1) {
        return scalarType
    }
    else {
        const vectorType = `vec${count}<${scalarType}>`
        return vectorType
    }
}

export function toWGSLStructBody(vertexBufferLayout: GPUVertexBufferLayoutNamed) {
    return `{\n${vertexBufferLayout.attributes.map((value, index) => `    @location(${index}) ${value.name}: ${toWGSLType(value.format)},\n`).join(``)}}\n`
}

export function defineRenderPipeline(vertexInput: GPUVertexBufferLayoutNamed, shader: string): GPURenderPipelineProperties {
    return { vertexInput, shader } satisfies GPURenderPipelineProperties;
}

export async function requestGPUDevice(): Promise<GPUDevice> {
    const adapter = await navigator.gpu.requestAdapter()
    if (!adapter) {
        throw new Error()
    }
    const device = await adapter.requestDevice()
    return device
}

export async function compileGPUShaderModule(device: GPUDevice, code: string): Promise<GPUShaderModule> {
    const shaderModule = device.createShaderModule({ code })
    const compilationInfo = await shaderModule.getCompilationInfo()
    if (compilationInfo.messages.length > 0) {
        let hadError = false
        let messages: string[] = []
        // console.log("Shader compilation log:");
        for (let i = 0; i < compilationInfo.messages.length; i++) {
            const msg = compilationInfo.messages[i]
            messages.push(`${msg.lineNum}:${msg.linePos} - ${msg.message}`)
            hadError ||= msg.type == "error"
        }
        throw new Error(`Shader Compilation ${hadError ? "Error" : "Warning"}:\n${messages.join("\n")}`)
    }
    return shaderModule
}

export function createVertexBufferLayoutNamed(properties: Record<string, GPUVertexFormat>): GPUVertexBufferLayoutNamed {
    let arrayStride = 0
    let attributes: GPUVertexAttributeNamed[] = []
    for (let [name, format] of Object.entries(properties)) {
        attributes.push({ format, offset: arrayStride, shaderLocation: attributes.length, name })
        let size = vertexFormatToSize[format]
        arrayStride += size
    }
    return { arrayStride, attributes }
}

export function stringKeys<T extends object>(object: T): StringKeyOf<T>[] {
    return Object.keys(object).filter(value => typeof value === "string") as StringKeyOf<T>[];
}

export function stringEntries<T extends object>(object: T): [StringKeyOf<T>, T[StringKeyOf<T>]][] {
    return stringKeys(object).map(name => [name, object[name]]);
}

export function readFlag<Flag extends number>(flags: Flag, check: Flag) {
    return (flags & check) !== 0
}
export function writeFlag<Flag extends number>(a: Flag, b: Flag, value: boolean): Flag {
    return (value ? a | b : a & ~b) as Flag
}

export async function loadImageBitmap(url: string, colorSpaceConversion = false) {
    const res = await fetch(url)
    const blob = await res.blob()
    return await createImageBitmap(blob, { colorSpaceConversion: colorSpaceConversion ? "default" : "none" })
}