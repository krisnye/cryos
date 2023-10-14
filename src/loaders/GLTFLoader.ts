import { GPUContext } from "../core/GPUContext.js"
import { gltfRenderModeToGPUPrimitiveTopology, gltfTypeSize, gltfVertexType } from "./GLTFFunctions.js"
import { GLBJSON, GLTFAttributes, GLTFRenderMode, GLTFType } from "./GLTFTypes.js"
import { GPUBufferView, GPUAccessor, GPUMesh, GPUPrimitive } from "../render/GPUMesh.js"

export async function loadGPUMeshes(c: GPUContext, url: string): Promise<Record<string, GPUMesh>> {
    const response = await fetch(url)
    const buffer = await response.arrayBuffer()

    // .glB has a JSON chunk and a binary chunk, potentially followed by
    // other chunks specifying extension specific data, which we ignore
    // since we don't support any extensions.
    // Read the glB header and the JSON chunk header together 
    // glB header:
    // - magic: u32 (expect: 0x46546C67)
    // - version: u32 (expect: 2)
    // - length: u32 (size of the entire file, in bytes)
    // JSON chunk header
    // - chunkLength: u32 (size of the chunk, in bytes)
    // - chunkType: u32 (expect: 0x4E4F534A for the JSON chunk)
    let header = new Uint32Array(buffer, 0, 5)
    if (header[0] != 0x46546C67) {
        throw Error("Provided file is not a glB file")
    }
    if (header[1] != 2) {
        throw Error("Provided file is not a glTF 2.0 file")
    }
    if (header[4] != 0x4E4F534A) {
        throw Error("Invalid glB: The first chunk of the glB file is not a JSON chunk!")
    }

    // Parse the JSON chunk of the glB file to a JSON object
    let json = JSON.parse(new TextDecoder("utf-8").decode(new Uint8Array(buffer, 20, header[3]))) as GLBJSON
    // Read the binary chunk header
    // - chunkLength: u32 (size of the chunk, in bytes)
    // - chunkType: u32 (expect: 0x46546C67 for the binary chunk)
    let binaryHeader = new Uint32Array(buffer, 20 + header[3], 2)
    if (binaryHeader[1] != 0x004E4942) {
        throw Error("Invalid glB: The second chunk of the glB file is not a binary chunk!")
    }
    // Make a GLTFBuffer that is a view of the entire binary chunk's data,
    // we'll use this to create buffer views within the chunk for memory referenced
    // by objects in the glTF scene
    let binaryChunk = new Uint8Array(buffer, 28 + header[3], binaryHeader[0])
    // Create GLTFBufferView objects for all the buffer views in the glTF file
    let bufferViews = json.bufferViews.map(view => new GPUBufferView(binaryChunk, view))

    // { bufferView: 3, componentType: 5126, count: 406, type: 'VEC2' }

    console.log(`glTF file has ${json.meshes.length} meshes`)
    const accessors = json.accessors.map(accessor => {
        const view = bufferViews[accessor.bufferView]
        const gltfType = GLTFType[accessor.type]
        const elementSize = gltfTypeSize(accessor.componentType, gltfType)
        const count = accessor.count
        const byteOffset = accessor.byteOffset ?? 0
        const byteStride = Math.max(elementSize, view.byteStride)
        const byteLength = count * byteStride
        const vertexType = gltfVertexType(accessor.componentType, gltfType)
        return {
            view, count, byteOffset, byteStride, byteLength, vertexType
        } satisfies GPUAccessor
    })

    // Load the first mesh
    const meshes: Record<string, GPUMesh> = {}
    json.meshes.forEach(mesh => {
        const meshPrimitives = mesh.primitives.map(primitive => {
            const topology = gltfRenderModeToGPUPrimitiveTopology(primitive.mode ?? GLTFRenderMode.TRIANGLES)
            const indices = primitive.indices ? accessors[primitive.indices] : undefined
            function getAccessor(name: keyof GLTFAttributes) {
                const index = primitive.attributes[name]
                return index !== undefined ? accessors[index] : undefined
            }
            const positions = getAccessor("POSITION")
            console.log({ indices, positions })
            if (!positions) {
                throw new Error(`POSITION attribute required`)
            }

            return new GPUPrimitive(positions, topology, indices)
        })
        meshes[mesh.name] = new GPUMesh(meshPrimitives)
    })

    for (let i = 0; i < bufferViews.length; ++i) {
        if (bufferViews[i].needsUpload) {
            bufferViews[i].upload(c.device)
        }
    }

    return meshes
}