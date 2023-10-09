import { stringKeys } from "../core/functions.js"
import type { StringKeyOf } from "../core/types.js"
import { Vector3 } from "../math/Vector3.js"
import { typeDescriptors } from "./constants.js"
import type { ArrayType, TypedArrayElementTypeId } from "./types.js"

export class Volume<Types extends Record<string, TypedArrayElementTypeId>> {

    private constructor(
        public readonly size: Vector3,
        public readonly types: Types,
        public readonly data: { [K in keyof Types]: ArrayType<Types[K]> }
    ) {
    }

    static create<Types extends Record<string, TypedArrayElementTypeId>>(
        size: Vector3,
        types: Types,
        data?: { [K in keyof Types]: ArrayType<Types[K]> }
    ): Volume<Types> {
        const length = size.x * size.y * size.z
        if (length === 0) {
            throw new Error("Size cannot be empty, did you include a zero component?")
        }
        if (!data) {
            data = Object.fromEntries(Object.entries(types).map(([name, typeId]) => {
                return [name, new typeDescriptors[typeId].arrayType(length)]
            })) as { [K in keyof Types]: ArrayType<Types[K]> }
        }
        return new Volume(size, types, data)
    }

    /**
     * @returns the index of this voxel or else < 0 if value is out of bounds.
     */
    index(x: number, y: number = 0.0, z: number = 0.0) {
        const [sizeX, sizeY, sizeZ] = this.size
        if (x < 0) {
            return -1
        }
        if (x >= sizeX) {
            return -2
        }
        if (y < 0) {
            return -3
        }
        if (y >= sizeY) {
            return -4
        }
        if (z < 0) {
            return -5
        }
        if (z >= sizeZ) {
            return -6
        }
        return x + (y + (z * sizeY)) * sizeX
    }

    public dataToString(name: StringKeyOf<Types>, options?: ToStringOptions) {
        const length = 8
        const array = this.data[name]
        const isFloat = this.types[name].startsWith("f")
        let sb = `  ${name}:\n\n`
        for (let z = 0; z < this.size.z; z++) {
            for (let y = 0; y < this.size.y; y++) {
                for (let x = 0; x < this.size.x; x++) {
                    let value = array[this.index(x, y, z)]
                    let valueString = options?.radix
                        ? value.toString(options?.radix).toUpperCase()
                        : value.toFixed(isFloat ? (options?.fractionDigits ?? 4) : 0)
                    valueString = valueString.slice(0, length).padStart(length, " ")
                    sb += valueString + ", "
                }
                sb += "\n"
            }
            sb += "\n"
        }
        return sb
    }

    toString(options?: ToStringOptions) {
        return `Volume${JSON.stringify({ size: this.size, types: this.types })}\n\n` +
            stringKeys(this.data).map(name => this.dataToString(name, options)).join("\n")
    }

}

type ToStringOptions = { radix?: number, fractionDigits?: number }
