import { Database } from "@adobe/data/ecs";
import { F32, Mat4x4, Vec3 } from "@adobe/data/math";
import { Schema } from "@adobe/data/schema";
import { createStructBuffer, copyToGPUBuffer, getStructLayout, TypedBuffer } from "@adobe/data/typed-buffer";
import { graphics } from "./graphics.js";
import { Camera } from "../types/index.js";

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
} as const satisfies Schema;

type SceneUniforms = Schema.ToType<typeof SceneUniformsSchema>;

export const scene = Database.Plugin.create({
    resources: {
        // Camera resource (singleton for single viewport)
        camera: {
            default: {
                aspect: 16 / 9,
                fieldOfView: Math.PI / 4,
                nearPlane: 0.1,
                farPlane: 100.0,
                position: [0, 0, 10] as Vec3,
                target: [0, 0, 0] as Vec3,
                up: [0, 1, 0] as Vec3,
                orthographic: 0,
            } satisfies Camera as Camera,
        },
        // Scene uniforms GPU buffer (transient - recreated each frame if needed)
        sceneUniformsBuffer: { default: null as GPUBuffer | null, transient: true },
        // Lighting resources
        lightDirection: { default: Vec3.normalize([-1, -3, -10]) as Vec3 },
        ambientStrength: { default: 0.5 as F32 },
        lightColor: { default: [1.0, 1.0, 1.0] as Vec3 },
    },
    systems: {
        updateSceneUniforms: {
            create: (db) => {
                // Retain the struct buffer for reuse across frames
                let structBuffer: TypedBuffer<SceneUniforms> | null = null;
                const structLayout = getStructLayout(SceneUniformsSchema);
                if (!structLayout) {
                    throw new Error("SceneUniformsSchema is not a valid struct schema");
                }

                return () => {
                    const { device, camera, lightDirection, ambientStrength, lightColor } = db.store.resources;
                    if (!device || !camera) return;

                    // Initialize struct buffer if needed
                    structBuffer ??= createStructBuffer(SceneUniformsSchema, new ArrayBuffer(structLayout.size));

                    // Create GPU buffer if it doesn't exist
                    let gpuBuffer = db.store.resources.sceneUniformsBuffer;
                    if (!gpuBuffer) {
                        gpuBuffer = device.createBuffer({
                            size: structLayout.size,
                            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
                        });
                        db.store.resources.sceneUniformsBuffer = gpuBuffer;
                    }

                    // Calculate view-projection matrix from camera
                    const viewProjection = Camera.toViewProjection(camera);

                    // Update the struct buffer with current values
                    structBuffer.set(0, {
                        viewProjectionMatrix: viewProjection,
                        lightDirection,
                        ambientStrength,
                        lightColor,
                    });

                    // Copy to GPU buffer
                    db.store.resources.sceneUniformsBuffer = copyToGPUBuffer(structBuffer, device, gpuBuffer);
                };
            },
            schedule: { during: ["preRender"] }
        }
    },
    extends: graphics
});

