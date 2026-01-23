import { Database } from "@adobe/data/ecs";
import { Vec3, Quat } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";
import { TypedBuffer, copyToGPUBuffer } from "@adobe/data/typed-buffer";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";
import instancedShaderSource from "./instanced-pbr.wgsl.js";
import { materialVertexBuffers } from "plugins/material-vertex-buffers.js";
import { CombinePlugins } from "@adobe/data/ecs/database/combine-plugins";
import { materials } from "plugins/materials.js";
import { geometry } from "plugins/geometry.js";

// Instanced transform data schema (per-instance vertex attributes)
export const instanceTransformSchema = {
    type: "object",
    properties: {
        position: Vec3.schema,
        scale: Vec3.schema,
        rotation: Quat.schema,
    },
    required: ["position", "scale", "rotation"],
    additionalProperties: false,
    layout: "packed",
} as const satisfies Schema;

// Type for grouped model instances
export type ModelGroup = {
    vertices: GPUBuffer;          // Shared vertex buffer (geometry)
    instanceCount: number;       // Number of instances
    positions: Vec3[];          // Instance transform data
    scales: Vec3[];
    rotations: Quat[];
};

export type PipelineConfig = {
    depthWriteEnabled: boolean;
    fragmentTarget: GPUColorTargetState;
};

/**
 * Query and group entities by vertex buffer component.
 * Returns a map of vertex buffers to their instance groups.
 */
export function queryAndGroupEntities(
    store: Database.Plugin.ToStore<CombinePlugins<[typeof materialVertexBuffers, typeof geometry]>>,
    vertexBufferComponentName: "opaqueVertexBuffer" | "transparentVertexBuffer"
): Map<GPUBuffer, ModelGroup> {
    // Query for all possible combinations (with/without scale/rotation)
    const renderTablesWithScaleRotation = store.queryArchetypes([vertexBufferComponentName, "position", "scale", "rotation"]);
    const renderTablesWithScale = store.queryArchetypes([vertexBufferComponentName, "position", "scale"], { exclude: ["rotation"] });
    const renderTablesWithRotation = store.queryArchetypes([vertexBufferComponentName, "position", "rotation"], { exclude: ["scale"] });
    const renderTablesBase = store.queryArchetypes([vertexBufferComponentName, "position"], { exclude: ["scale", "rotation"] });
    const renderTables = [...renderTablesWithScaleRotation, ...renderTablesWithScale, ...renderTablesWithRotation, ...renderTablesBase];

    // Group entities by vertex buffer (model type)
    const modelGroups = new Map<GPUBuffer, ModelGroup>();

    for (const table of renderTables) {
        const entityCount = table.rowCount;
        // const entityIds = table.columns.id.getTypedArray();

        // Extract per-entity data directly
        for (let i = 0; i < entityCount; i++) {
            // const entityId = entityIds[i];
            const vertexBuffer = table.columns[vertexBufferComponentName]?.get(i) as GPUBuffer | undefined;
            const position = table.columns.position.get(i);
            // Default scale and rotation if not present (check if column exists in columns object)
            const scaleColumn = 'scale' in table.columns ? (table.columns as { scale?: TypedBuffer<Vec3> }).scale : undefined;
            const rotationColumn = 'rotation' in table.columns ? (table.columns as { rotation?: TypedBuffer<Quat> }).rotation : undefined;
            const scale = (scaleColumn ? scaleColumn.get(i) : [1, 1, 1]) as Vec3;
            const rotation = (rotationColumn ? rotationColumn.get(i) : [0, 0, 0, 1]) as Quat;

            if (!vertexBuffer) continue;

            // Initialize group if needed
            if (!modelGroups.has(vertexBuffer)) {
                modelGroups.set(vertexBuffer, {
                    vertices: vertexBuffer,
                    instanceCount: 0,
                    positions: [],
                    scales: [],
                    rotations: []
                });
            }

            const group = modelGroups.get(vertexBuffer)!;

            // Add instance data
            group.positions.push(position);
            group.scales.push(scale);
            group.rotations.push(rotation);
            group.instanceCount++;
        }
    }

    return modelGroups;
}

/**
 * Create or get bind group layout for instanced PBR rendering.
 */
export function getOrCreateBindGroupLayout(device: GPUDevice, existing: GPUBindGroupLayout | null): GPUBindGroupLayout {
    if (existing) return existing;
    
    return device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'uniform' }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                buffer: { type: 'read-only-storage' }
            }
        ]
    });
}

/**
 * Create or get render pipeline for instanced PBR rendering.
 */
export function getOrCreatePipeline(
    device: GPUDevice,
    existing: GPURenderPipeline | null,
    bindGroupLayout: GPUBindGroupLayout,
    config: PipelineConfig,
    depthTexture?: GPUTexture | null
): GPURenderPipeline {
    if (existing) return existing;

    return device.createRenderPipeline({
        layout: device.createPipelineLayout({
            bindGroupLayouts: [bindGroupLayout]
        }),
        vertex: {
            module: device.createShaderModule({ code: instancedShaderSource }),
            entryPoint: 'vertexMain',
            buffers: [
                // Buffer 0: Geometry data (PositionNormalMaterialVertex)
                {
                    arrayStride: PositionNormalMaterialVertex.layout.size,
                    attributes: [
                        { shaderLocation: 0, format: 'float32x3', offset: 0 },    // position
                        { shaderLocation: 1, format: 'float32x3', offset: 12 },   // normal
                        { shaderLocation: 2, format: 'uint32', offset: 24 },       // materialIndex
                    ]
                },
                // Buffer 1: Instance data (InstanceTransform)
                {
                    arrayStride: 40, // 3*4 + 3*4 + 4*4 = 40 bytes  
                    stepMode: 'instance',
                    attributes: [
                        { shaderLocation: 4, format: 'float32x3', offset: 0 },  // instancePosition
                        { shaderLocation: 5, format: 'float32x3', offset: 12 },   // instanceScale
                        { shaderLocation: 6, format: 'float32x4', offset: 24 },   // instanceRotation
                    ]
                }
            ]
        },
        fragment: {
            module: device.createShaderModule({ code: instancedShaderSource }),
            entryPoint: 'fragmentMain',
            targets: [config.fragmentTarget]
        },
        primitive: {
            topology: 'triangle-list',
            cullMode: 'back'
        },
        depthStencil: {
            depthWriteEnabled: config.depthWriteEnabled,
            depthCompare: 'less-equal',
            format: depthTexture?.format ?? 'depth24plus'
        }
    });
}

/**
 * Render a group of instances with the given vertex buffer.
 */
export function renderGroup(
    device: GPUDevice,
    renderPassEncoder: GPURenderPassEncoder,
    sceneUniformsBuffer: GPUBuffer,
    materialsGpuBuffer: GPUBuffer,
    bindGroupLayout: GPUBindGroupLayout,
    pipeline: GPURenderPipeline,
    vertexBuffer: GPUBuffer,
    group: ModelGroup,
    instanceDataBuffer: TypedBuffer<{ position: Vec3; scale: Vec3; rotation: Quat }>,
    groupGpuBuffers: Map<GPUBuffer, GPUBuffer>
): void {
    // Ensure instance data buffer is large enough
    if (instanceDataBuffer.capacity < group.instanceCount) {
        instanceDataBuffer.capacity = group.instanceCount;
    }

    // Populate instance data
    for (let i = 0; i < group.instanceCount; i++) {
        instanceDataBuffer.set(i, {
            position: group.positions[i],
            scale: group.scales[i],
            rotation: group.rotations[i]
        });
    }

    // Get or create GPU buffer for this group's instance data
    let gpuBuffer = groupGpuBuffers.get(vertexBuffer);
    const instanceDataArray = instanceDataBuffer.getTypedArray();
    
    if (!gpuBuffer || gpuBuffer.size < instanceDataArray.byteLength) {
        if (gpuBuffer) {
            gpuBuffer.destroy(); // Destroy old buffer if too small
        }
        gpuBuffer = device.createBuffer({
            size: instanceDataArray.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            mappedAtCreation: false
        });
        groupGpuBuffers.set(vertexBuffer, gpuBuffer);
    }

    // Copy instance data to GPU buffer
    gpuBuffer = copyToGPUBuffer(instanceDataBuffer, device, gpuBuffer);

    // Set up rendering state
    renderPassEncoder.setVertexBuffer(0, vertexBuffer, 0);
    renderPassEncoder.setVertexBuffer(1, gpuBuffer, 0);
    renderPassEncoder.setPipeline(pipeline);

    // Create bind group and set it
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            { binding: 0, resource: { buffer: sceneUniformsBuffer } },
            { binding: 1, resource: { buffer: materialsGpuBuffer } }
        ]
    });
    renderPassEncoder.setBindGroup(0, bindGroup);

    // Calculate vertex count from buffer size
    const vertexCount = vertexBuffer.size / PositionNormalMaterialVertex.layout.size;

    // Draw all instances
    renderPassEncoder.draw(vertexCount, group.instanceCount, 0, 0);
}

