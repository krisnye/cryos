import { AabbFace, Quat, Vec3, Vec4 } from "@adobe/data/math";
import { VoxelEditorStore } from "../voxel-editor-store.js";
import { applyCheckerboardColor } from "../functions/apply-checkerboard-color.js";

const WALL_COLOR: Vec4 = [0.5, 0.5, 0.5, 1] as const;

export const setModelSize = (t: VoxelEditorStore, size: Vec3) => {
    t.resources.modelSize = size;

    // delete all walls
    for (const wall of t.select(t.archetypes.Wall.components)) {
        t.delete(wall);
    }
    
    // Create walls just outside the [0, width) x [0, height) x [0, depth) model space
    // Model voxels are at integer positions 0 to size-1, each extending ±0.5
    // Model occupies space [-0.5, width-0.5] x [-0.5, height-0.5] x [-0.5, depth-0.5]
    // Walls are positioned at -1 (negative faces) and size (positive faces)
    // Each face needs size+2 walls in the tangential directions to fully enclose
    const [width, height, depth] = size;
    const offset = 0.5;

    // POS_Z face (z = depth)
    for (let x = -1; x <= width; x++) {
        for (let y = -1; y <= height; y++) {
            const position: Vec3 = [x + offset, y + offset, depth + offset];
            t.archetypes.Wall.insert({
                wall: true,
                pickable: true,
                wallFace: AabbFace.POS_Z,
                position,
                color: applyCheckerboardColor(position, WALL_COLOR, size),
                scale: [1, 1, 1],
                rotation: Quat.identity,
            });
        }
    }

    // NEG_Z face (z = -1)
    for (let x = -1; x <= width; x++) {
        for (let y = -1; y <= height; y++) {
            const position: Vec3 = [x + offset, y + offset, -1 + offset];
            t.archetypes.Wall.insert({
                wall: true,
                pickable: true,
                wallFace: AabbFace.NEG_Z,
                position,
                color: applyCheckerboardColor(position, WALL_COLOR, size),
                scale: [1, 1, 1],
                rotation: Quat.identity,
            });
        }
    }

    // POS_X face (x = width)
    for (let y = -1; y <= height; y++) {
        for (let z = -1; z <= depth; z++) {
            const position: Vec3 = [width + offset, y + offset, z + offset];
            t.archetypes.Wall.insert({
                wall: true,
                pickable: true,
                wallFace: AabbFace.POS_X,
                position,
                color: applyCheckerboardColor(position, WALL_COLOR, size),
                scale: [1, 1, 1],
                rotation: Quat.identity,
            });
        }
    }

    // NEG_X face (x = -1)
    for (let y = -1; y <= height; y++) {
        for (let z = -1; z <= depth; z++) {
            const position: Vec3 = [-1 + offset, y + offset, z + offset];
            t.archetypes.Wall.insert({
                wall: true,
                pickable: true,
                wallFace: AabbFace.NEG_X,
                position,
                color: applyCheckerboardColor(position, WALL_COLOR, size),
                scale: [1, 1, 1],
                rotation: Quat.identity,
            });
        }
    }

    // POS_Y face (y = height)
    for (let x = -1; x <= width; x++) {
        for (let z = -1; z <= depth; z++) {
            const position: Vec3 = [x + offset, height + offset, z + offset];
            t.archetypes.Wall.insert({
                wall: true,
                pickable: true,
                wallFace: AabbFace.POS_Y,
                position,
                color: applyCheckerboardColor(position, WALL_COLOR, size),
                scale: [1, 1, 1],
                rotation: Quat.identity,
            });
        }
    }

    // NEG_Y face (y = -1)
    for (let x = -1; x <= width; x++) {
        for (let z = -1; z <= depth; z++) {
            const position: Vec3 = [x + offset, -1 + offset, z + offset];
            t.archetypes.Wall.insert({
                wall: true,
                pickable: true,
                wallFace: AabbFace.NEG_Y,
                position,
                color: applyCheckerboardColor(position, WALL_COLOR, size),
                scale: [1, 1, 1],
                rotation: Quat.identity,
            });
        }
    }
}