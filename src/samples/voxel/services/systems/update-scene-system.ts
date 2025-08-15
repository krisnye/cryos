
import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { createStructBuffer, getStructLayout } from "@adobe/data/typed-buffer";
import { SceneSchema } from "../../types/scene.js";
import { toViewProjection } from "graphics/camera/to-view-projection.js";

export const updateSceneSystem = ({ store }: MainService): System => {
    const { device } = store.resources.graphics;
    const sceneLayout = getStructLayout(SceneSchema);
    console.log("sceneLayout", sceneLayout);
    const sceneTypedBuffer = createStructBuffer(SceneSchema, 1);
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
                time: store.resources.updateFrame.count / 60.0,
            });
            store.resources.sceneBuffer = sceneGPUBuffer;
            device.queue.writeBuffer(sceneGPUBuffer, 0, sceneTypedBuffer.getTypedArray());
        }
    }
};
