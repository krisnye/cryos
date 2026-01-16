import { Database } from "@adobe/data/ecs";
import { TypedBuffer } from "@adobe/data/typed-buffer";
import { volumeModel } from "../volume-model.js";
import { PositionNormalMaterialVertex } from "../../types/vertices/position-normal-material/index.js";
import { Volume } from "../../types/volume/volume.js";
import { MaterialId } from "../../types/material/material-id.js";

/**
 * Data plugin for volume model rendering components.
 * Defines shared components used by multiple rendering systems.
 */
export const volumeModelRenderingData = Database.Plugin.create({
    extends: volumeModel,
    components: {
        volumeModelVertexData: { default: null as unknown as TypedBuffer<PositionNormalMaterialVertex> },
        volumeModelVertexSource: { default: null as unknown as Volume<MaterialId> },
        modelVertexBuffer: { default: null as unknown as GPUBuffer, transient: true }, // GPUBuffer is not serializable
        modelVertexBufferSource: { default: null as unknown as TypedBuffer<PositionNormalMaterialVertex> },
    },
});

