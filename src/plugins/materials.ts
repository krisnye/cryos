import { Database } from "@adobe/data/ecs";
import { physics } from "./physics/physics.js";
import { copyToGPUBuffer, createTypedBuffer } from "@adobe/data/typed-buffer";
import { Material } from "../types/index.js";

export const materials = Database.Plugin.create({
    extends: physics,
    resources: {
        materialsDataBuffer: { default: createTypedBuffer(Material.schema, Material.materials.length), transient: true },
        materialsGpuBuffer: { default: null as GPUBuffer | null, transient: true },
    },
    systems: {
        update_materials_buffer: {
            create: (db) => {
                // copy materials into the data buffer.
                // the materials are just an object, but within the data buffer they are store as linear std140 struct memory.
                for (let i = 0; i < Material.materials.length; i++) {
                    db.store.resources.materialsDataBuffer.set(i, Material.materials[i]);
                }
                return () => {
                    if (db.store.resources.device && !db.store.resources.materialsGpuBuffer) {
                        db.store.resources.materialsGpuBuffer = db.store.resources.device.createBuffer({
                            size: db.store.resources.materialsDataBuffer.getTypedArray().byteLength,
                            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                        });
                        db.store.resources.materialsGpuBuffer = copyToGPUBuffer(db.store.resources.materialsDataBuffer, db.store.resources.device, db.store.resources.materialsGpuBuffer);
                    }
                }
            },
            schedule: { during: ["preRender"] }
        }
    },
})
