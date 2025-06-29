
import { System } from "graphics/systems/system.js";
import { MainService } from "../create-main-service.js";
import { createStructBuffer } from "@adobe/data/typed-buffer";
import { SceneSchema } from "samples/particles/types/scene.js";
import { toViewProjection } from "graphics/camera/to-view-projection.js";

export const updateSceneSystem = ({ store }: MainService): System => {
    const { device } = store.resources.graphics;
    const sceneTypedBuffer = createStructBuffer({ schema: SceneSchema, length: 1, maxLength: 1 });
    const sceneGPUBuffer = device.createBuffer({
        size: sceneTypedBuffer.getTypedArray().byteLength,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    return {
        name: "updateSceneSystem",
        phase: "update",
        run: () => {
            sceneTypedBuffer.set(0, {
                viewProjection: toViewProjection(store.resources.camera),
                lightDirection: store.resources.lightDirection,
                lightColor: store.resources.lightColor,
                ambientStrength: store.resources.ambientStrength,
            });
            store.resources.sceneBuffer = sceneGPUBuffer;
            device.queue.writeBuffer(sceneGPUBuffer, 0, sceneTypedBuffer.getTypedArray());
        }
    }
};
