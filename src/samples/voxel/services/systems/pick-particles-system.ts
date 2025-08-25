import { System } from "graphics/systems/system.js";
import { MainService } from "../main-service.js";
import { screenToWorldRay, toViewProjection } from "graphics/camera/index.js";
import * as MAT4 from "math/mat4x4/functions.js";
import { pickFromSpatialMap } from "samples/voxel/types/spatial-map/index.js";
import { Vec3 } from "math/index.js";

export const pickParticlesSystem = ({ store, database }: MainService): System => {
    return {
        name: "pickParticlesSystem",
        phase: "preRender",
        run: () => {
            const screenPosition = store.resources.mousePosition;
            const camera = store.resources.camera;
            const canvasWidth = store.resources.graphics.canvas.width;
            const canvasHeight = store.resources.graphics.canvas.height;
            
            // Compute the inverse view-projection matrix
            const viewProjection = toViewProjection(camera);
            const invViewProjection = MAT4.inverse(viewProjection);
            
            // Convert screen position to world space pick line
            const pickLine = screenToWorldRay(screenPosition, invViewProjection, canvasWidth, canvasHeight);
            
            // Use voxel-based spatial lookup for picking static particles
            // radius: 0 for precise picking, larger values for collision detection
            const picked = pickFromSpatialMap(
                store.resources.mapColumns,
                pickLine,
                0,
                (entity) => store.get(entity, "boundingBox")!
            );

            // weirdness from storing position and scale together.
            const position: Vec3 = picked ? store.read(picked.entity)!.position_scale.slice(0, 3) as unknown as Vec3 : [-1000, -1000, -1000];
            store.resources.hoverPosition = position;
            store.resources.hoverFace = picked?.face ?? 10;
            console.log("picked", JSON.stringify(position), picked?.face);
            // if (picked) {
            //     // console.log(`Picked particle ${picked.entity} at face ${picked.face} (${FaceMeta[picked.face].name})`);
            //     // const randomColor = [Math.random(), Math.random(), Math.random(), 1] as const;
            //     // database.transactions.setColor({ id: picked.entity, color: randomColor });
            //     // picked.position and picked.face are now available
            // }
        }
    } as const satisfies System;
};
