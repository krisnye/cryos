import type { Entity } from "@adobe/data/ecs";
import { Aabb, Line3, Vec3 } from "@adobe/data/math";
import { Material } from "../../types/material/material.js";
import { PhysicalVoxel } from "../../types/physical-voxel/physical-voxel.js";
import type { PickResult } from "../../types/pick-result.js";
import * as VolumeNamespace from "../../types/volume/public.js";
import type { VolumeModelDatabase } from "./volume-model.js";

/**
 * General pick: iterate over VolumeModel entities, transform ray to model space,
 * call Volume.pick, return closest hit. Position + scale (no rotation).
 */
export const pickVolumeModels = (
    db: VolumeModelDatabase,
    line: Line3
): PickResult | null => {
    const tables = db.queryArchetypes(["volumeModel", "materialVolume", "position"] as const);

    let closest: PickResult | null = null;

    for (const table of tables) {
        const { id, position, materialVolume } = table.columns;
        const scaleCol = (table.columns as { scale?: { get: (i: number) => Vec3 } }).scale;

        if (!id || !position || !materialVolume) continue;

        for (let i = 0; i < table.rowCount; i++) {
            const entityId = id.get(i) as Entity;
            const pos = position.get(i) as Vec3 | undefined;
            const volume = materialVolume.get(i);

            if (!pos || !volume) continue;

            const scale: Vec3 = scaleCol?.get(i) ?? [1, 1, 1];

            const modelLine: Line3 = {
                a: [
                    (line.a[0] - pos[0]) / scale[0],
                    (line.a[1] - pos[1]) / scale[1],
                    (line.a[2] - pos[2]) / scale[2],
                ],
                b: [
                    (line.b[0] - pos[0]) / scale[0],
                    (line.b[1] - pos[1]) / scale[1],
                    (line.b[2] - pos[2]) / scale[2],
                ],
            };

            const pickResult = VolumeNamespace.pick(
                volume,
                modelLine,
                (voxel) => PhysicalVoxel.getMaterialId(voxel) !== Material.ids.air
            );

            if (pickResult && (closest === null || pickResult.alpha < closest.lineAlpha)) {
                const worldPosition = Line3.interpolate(line, pickResult.alpha);
                const modelPosition = Line3.interpolate(modelLine, pickResult.alpha);
                const faceNormal = Aabb.Face.getNormal(pickResult.face);
                closest = {
                    entity: entityId as Entity,
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

    return closest;
};
