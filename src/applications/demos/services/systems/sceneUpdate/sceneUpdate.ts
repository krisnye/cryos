import { createStructBuffer } from "../../../../../data/buffers";
import { Camera_toViewProjection } from "../../../../../data/graphics/Camera/toViewProjection";
import { SceneSchema } from "../../../types/Scene";
import { StateService } from "../../StateService";
import { Systems } from "../Systems";

export const createSceneUpdate = (db: StateService): Systems => {
    const { device } = db.resources;
    const sceneTypedBuffer = createStructBuffer({ schema: SceneSchema, length: 1, maxLength: 1 });
    const sceneGPUBuffer = device.createBuffer({
        size: sceneTypedBuffer.array.byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return {
        name: "sceneUpdate",
        update(commandEncoder: GPUCommandEncoder) {
            sceneTypedBuffer.set(0, {
                viewProjection: Camera_toViewProjection(db.resources.camera),
                lightDirection: db.resources.lightDirection,
                lightColor: db.resources.lightColor,
                ambientStrength: db.resources.ambientStrength,
            });
            db.resources.sceneBuffer = sceneGPUBuffer;
            device.queue.writeBuffer(sceneGPUBuffer, 0, sceneTypedBuffer.array);
        }
    };
}