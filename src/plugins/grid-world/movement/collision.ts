import { Line3, Vec3 } from "@adobe/data/math";
import { Aabb } from "types/aabb/index.js";
import { ColumnVolume } from "../../../types/column-volume/column-volume.js";
import { Material } from "../../../types/material/material.js";
import { PhysicalVoxel } from "../../../types/physical-voxel/physical-voxel.js";
import type { PickResult } from "../../../types/pick-result.js";
import { Volume } from "../../../types/volume/volume.js";
import type { GridWorldDatabase } from "../grid-world.js";

const getWorldChunkKey = (chunkX: number, chunkY: number): number => {
    return chunkX * 10000 + chunkY;
};

/**
 * DDA-based broad-phase: step along the line visiting only chunks the line crosses.
 * Returns the first solid voxel hit, or null if no hit.
 */
export const pickGridWorld = (db: GridWorldDatabase, line: Line3): PickResult | null => {
    const { worldChunks, worldScale } = db.resources;
    const { chunkSize, blockSize } = worldScale;

    const dx = line.b[0] - line.a[0];
    const dy = line.b[1] - line.a[1];

    let chunkX = Math.floor(line.a[0] / chunkSize);
    let chunkY = Math.floor(line.a[1] / chunkSize);

    const stepDirX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
    const stepDirY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

    const stepX = dx === 0 ? Infinity : chunkSize / Math.abs(dx);
    const stepY = dy === 0 ? Infinity : chunkSize / Math.abs(dy);

    let tMaxX: number;
    let tMaxY: number;
    if (stepDirX > 0) {
        tMaxX = ((chunkX + 1) * chunkSize - line.a[0]) / dx;
    } else if (stepDirX < 0) {
        tMaxX = (chunkX * chunkSize - line.a[0]) / dx;
    } else {
        tMaxX = Infinity;
    }
    if (stepDirY > 0) {
        tMaxY = ((chunkY + 1) * chunkSize - line.a[1]) / dy;
    } else if (stepDirY < 0) {
        tMaxY = (chunkY * chunkSize - line.a[1]) / dy;
    } else {
        tMaxY = Infinity;
    }

    let t = 0;
    const maxIterations = 1000;
    let iterations = 0;

    while (iterations < maxIterations && t <= 1) {
        iterations++;
        const chunkKey = getWorldChunkKey(chunkX, chunkY);
        const chunkEntity = worldChunks.get(chunkKey);

        if (chunkEntity) {
            const chunkPosition = db.get(chunkEntity, "position") as Vec3 | undefined;
            const chunkVolume = db.get(chunkEntity, "materialVolume") as ColumnVolume<PhysicalVoxel> | undefined;

            if (chunkPosition && chunkVolume) {
                const modelLine: Line3 = {
                    a: [
                        (line.a[0] - chunkPosition[0]) / blockSize,
                        (line.a[1] - chunkPosition[1]) / blockSize,
                        (line.a[2] - chunkPosition[2]) / blockSize,
                    ],
                    b: [
                        (line.b[0] - chunkPosition[0]) / blockSize,
                        (line.b[1] - chunkPosition[1]) / blockSize,
                        (line.b[2] - chunkPosition[2]) / blockSize,
                    ],
                };

                const pickResult = Volume.pick(
                    chunkVolume,
                    modelLine,
                    (voxel) => PhysicalVoxel.getMaterialId(voxel) !== Material.ids.air
                );

                if (pickResult) {
                    const worldPosition = Line3.interpolate(line, pickResult.alpha);
                    const modelPosition = Line3.interpolate(modelLine, pickResult.alpha);
                    const faceNormal = Aabb.Face.getNormal(pickResult.face);
                    return {
                        entity: chunkEntity,
                        lineAlpha: pickResult.alpha,
                        worldPosition,
                        modelPosition,
                        modelCoordinates: pickResult.coordinates,
                        face: pickResult.face,
                        faceNormal,
                    };
                }
            }
        }

        if (tMaxX < tMaxY) {
            t = tMaxX;
            chunkX += stepDirX;
            tMaxX += stepX;
        } else {
            t = tMaxY;
            chunkY += stepDirY;
            tMaxY += stepY;
        }
    }

    return null;
};
