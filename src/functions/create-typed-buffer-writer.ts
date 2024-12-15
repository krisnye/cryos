import { DataType } from "../types/data-types.js"
import { align } from "./align.js"
import { getBaseAlignment } from "./get-base-alignment.js"

export interface TypedBufferWriter {
    readonly byteArray: ArrayBuffer
    readonly f32Array: Float32Array
    readonly u32Array: Uint32Array
    readonly i32Array: Int32Array
    write(type: DataType, value: any, byteOffset?: number): number
}

export function createTypedBufferWriter(sizeInBytes: number = 0): TypedBufferWriter {
    const byteArray = new ArrayBuffer(sizeInBytes)
    const f32Array = new Float32Array(byteArray)
    const u32Array = new Uint32Array(byteArray)
    const i32Array = new Int32Array(byteArray)

    function write(type: DataType, value: any, byteOffset: number): number {
        if (typeof type === 'object' && !Array.isArray(type)) {
            let totalWritten = 0
            const structAlignment = getBaseAlignment(type)
            const alignedOffset = align(byteOffset, structAlignment)

            for (const [fieldName, fieldType] of Object.entries(type)) {
                const fieldValue = value[fieldName]
                const fieldAlignment = getBaseAlignment(fieldType as DataType)
                totalWritten = align(totalWritten, fieldAlignment)
                
                const written = write(
                    fieldType as DataType,
                    fieldValue,
                    alignedOffset + totalWritten
                )
                totalWritten += written
            }
            
            return align(totalWritten, structAlignment)
        }

        if (Array.isArray(value)) {
            const vecAlignment = getBaseAlignment(type)
            const alignedOffset = align(byteOffset, vecAlignment)
            const index = alignedOffset / 4

            for (let i = 0; i < value.length; i++) {
                f32Array[index + i] = value[i]
            }
            
            return type === "vec3" ? 16 : value.length * 4
        }

        const scalarAlignment = getBaseAlignment(type)
        const alignedOffset = align(byteOffset, scalarAlignment)
        const index = alignedOffset / 4

        switch (type) {
            case "f32":
                f32Array[index] = value
                break
            case "u32":
                u32Array[index] = value
                break
            case "i32":
                i32Array[index] = value
                break
        }
        return 4
    }

    return {
        byteArray,
        f32Array,
        u32Array,
        i32Array,
        write
    }
} 