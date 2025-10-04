import { Quat, Vec3, Vec4 } from "@adobe/data/math";
import { createTypedBuffer } from "@adobe/data/typed-buffer";
import { Rgba, Volume } from "data/index.js";
import { index } from "data/volume/volume.js";
import { GraphicsStore } from "graphics/database/graphics-store.js";
import { createVoxelModel } from "./create-voxel-model.js";

export function createCircleModel(t: GraphicsStore, props: {
    position: Vec3,
    scale: Vec3,
    rotation: Quat,
    color: Vec4,
    radius: number,
}) {
    const size = [props.radius * 2, props.radius * 2, 1] as Vec3;
    const elements = size[0] * size[1] * size[2];
    const data = createTypedBuffer(Rgba.schema, elements);
    const color = Rgba.fromVec4(props.color);
    const volume = Volume.create({ size, data });
    
    const centerX = props.radius;
    const centerY = props.radius;
    
    for (let x = 0; x < size[0]; x++) {
        for (let y = 0; y < size[1]; y++) {
            const dx = x - centerX;
            const dy = y - centerY;
            const distSquared = dx * dx + dy * dy;
            
            if (distSquared <= props.radius * props.radius) {
                data.set(index(volume, x, y, 0), color);
            }
        }
    }
    
    return createVoxelModel(t, {
        ...props,
        voxelColor: volume
    });
}
