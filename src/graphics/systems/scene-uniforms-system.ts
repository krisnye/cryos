import { GraphicsService } from "graphics/graphics-service.js";
import { SystemFactory } from "systems/system-factory.js";
import { F32, Mat4x4, Vec3 } from "@adobe/data/math";
import { createStructBuffer, copyToGPUBuffer, TypedBuffer, getStructLayout } from "@adobe/data/typed-buffer";
import { FromSchema } from "@adobe/data/schema";
import { Camera } from "graphics/camera/camera.js";

// Scene uniforms schema
const SceneUniformsSchema = {
    type: 'object',
    properties: {
        viewProjectionMatrix: Mat4x4.schema,
        lightDirection: Vec3.schema,
        ambientStrength: F32.schema,
        lightColor: Vec3.schema,
    },
    required: ["viewProjectionMatrix", "lightDirection", "ambientStrength", "lightColor"],
    additionalProperties: false,
} as const;
type SceneUniforms = FromSchema<typeof SceneUniformsSchema>;

export const sceneUniformsSystem: SystemFactory<GraphicsService> = (service) => {
    const { store } = service;
    
    // Retain the struct buffer
    let structBuffer: TypedBuffer<SceneUniforms> | null = null;
    let structLayout = getStructLayout(SceneUniformsSchema);
    
    return [{
        name: "updateSceneUniforms",
        phase: "pre-render",
        run: () => {
            const { device } = store.resources;
            if (!device) return;
            
            const activeViewportId = store.resources.activeViewport;
            const activeViewport = store.read(activeViewportId, store.archetypes.Viewport);
            if (!activeViewport) return;

            const { camera, sceneUniformsBuffer } = activeViewport;
            const viewProjection = Camera.toViewProjection(camera);
            
            structBuffer ??= createStructBuffer(SceneUniformsSchema, new ArrayBuffer(structLayout.size));

            // Create GPU buffer if it doesn't exist
            let gpuBuffer = sceneUniformsBuffer;
            if (!gpuBuffer) {
                gpuBuffer = device.createBuffer({
                    size: structLayout.size,
                    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                });
                store.update(activeViewportId, { sceneUniformsBuffer: gpuBuffer });
            }

            // Update the struct buffer with current values
            structBuffer.set(0, {
                viewProjectionMatrix: viewProjection,
                lightDirection: store.resources.lightDirection,
                ambientStrength: store.resources.ambientStrength,
                lightColor: store.resources.lightColor,
            });

            // Copy to GPU buffer
            copyToGPUBuffer(structBuffer, device, gpuBuffer);
        },
        dispose: () => {
            structBuffer = null;
        }
    }];
};
