import { Aabb, Line3, Vec3 } from "@adobe/data/math";
import type { AabbFace } from "@adobe/data/math/aabb/face/index";
import { Aabb as AabbNamespace } from "@adobe/data/math";
import type { DenseVolume } from "./dense-volume.js";
import { getIndex } from "./get-index.js";
import { getCoordinates } from "./get-coordinates.js";

/**
 * A dense volume occupies a bounding box with size [0-size[0], 0-size[1], 0-size[2]].
 * The voxel at index 0 is centered at position [0.5, 0.5, 0.5] with bounds [0, 0, 0] -> [1, 1, 1].
 * 
 * We pick the closest voxel to the line.a that is pickable.
 * @param volume 
 * @param line 
 * @param pickable 
 * @returns the pick result with voxel coordinates, alpha, and face hit, or null if no voxel is picked.
 */
export const pick = <T>(
    volume: DenseVolume<T>,
    line: Line3,
    pickable: (voxel: T) => boolean
): { coordinates: Vec3; alpha: number; face: AabbFace } | null => {
    // Algorithm: Broad-phase AABB test, then DDA (Digital Differential Analyzer) voxel traversal.
    // DDA steps along the ray one voxel at a time by tracking distance to next boundary on each axis,
    // always advancing to the nearest boundary. Returns first pickable voxel encountered.
    const [width, height, depth] = volume.size;
    
    // Broad-phase: check if line intersects volume's bounding box
    const box: Aabb = {
        min: [0, 0, 0],
        max: [width, height, depth]
    };
    const alpha = AabbNamespace.lineIntersection(box, line);
    
    if (alpha === -1) {
        return null; // Line doesn't intersect volume at all
    }
    
    // Calculate ray direction and normalize
    const dx = line.b[0] - line.a[0];
    const dy = line.b[1] - line.a[1];
    const dz = line.b[2] - line.a[2];
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (len === 0) return null;
    
    const dirX = dx / len;
    const dirY = dy / len;
    const dirZ = dz / len;
    
    // Start at box entry point. Nudge slightly along ray to avoid floor() on exact
    // boundaries (e.g. 0.9999999999999999 vs 1.0) which can occur with angled rays.
    const eps = 1e-10;
    const startPoint = Line3.interpolate(line, alpha);
    let x = startPoint[0] + eps * dirX;
    let y = startPoint[1] + eps * dirY;
    let z = startPoint[2] + eps * dirZ;
    const startT = alpha * len + eps;
    
    // DDA algorithm: step along the ray, visiting voxels
    // Calculate step size for each axis (distance to travel for 1 voxel)
    const stepX = dirX === 0 ? Infinity : Math.abs(1 / dirX);
    const stepY = dirY === 0 ? Infinity : Math.abs(1 / dirY);
    const stepZ = dirZ === 0 ? Infinity : Math.abs(1 / dirZ);
    
    // Calculate initial voxel coordinates (floor to get voxel indices)
    let voxelX = Math.floor(x);
    let voxelY = Math.floor(y);
    let voxelZ = Math.floor(z);
    
    // Determine step direction for each axis
    const stepDirX = dirX > 0 ? 1 : (dirX < 0 ? -1 : 0);
    const stepDirY = dirY > 0 ? 1 : (dirY < 0 ? -1 : 0);
    const stepDirZ = dirZ > 0 ? 1 : (dirZ < 0 ? -1 : 0);
    
    // Calculate initial t values (distance along ray to next voxel boundary)
    // These are absolute distances from the ray origin
    // When positive direction: next boundary is at voxelX + 1
    // When negative direction: next boundary is at voxelX (current position)
    let tMaxX = dirX === 0 ? Infinity : 
                dirX > 0 ? ((voxelX + 1) - line.a[0]) / dirX : 
                (voxelX - line.a[0]) / dirX;
    let tMaxY = dirY === 0 ? Infinity : 
                dirY > 0 ? ((voxelY + 1) - line.a[1]) / dirY : 
                (voxelY - line.a[1]) / dirY;
    let tMaxZ = dirZ === 0 ? Infinity : 
                dirZ > 0 ? ((voxelZ + 1) - line.a[2]) / dirZ : 
                (voxelZ - line.a[2]) / dirZ;
    
    // Maximum distance to check
    const maxDistance = len;
    let currentDistance = startT;
    
    // Safety limit to prevent infinite loops (generous for diagonal traversals)
    const maxIterations = (width + height + depth) * 2;
    let iterations = 0;
    
    // Track which face was hit when entering the current voxel
    let entryFace: AabbFace = AabbNamespace.Face.POS_Z; // Default for first voxel
    
    // Use <= so we check the voxel at the segment endpoint (angled rays can hit there)
    while (iterations < maxIterations && currentDistance <= maxDistance) {
        iterations++;
        
        // Check if current voxel is within bounds
        if (voxelX >= 0 && voxelX < width && 
            voxelY >= 0 && voxelY < height && 
            voxelZ >= 0 && voxelZ < depth) {
            
            const voxelIndex = getIndex(volume, voxelX, voxelY, voxelZ);
            const voxel = volume.data.get(voxelIndex);
            
            if (pickable(voxel)) {
                const alpha = currentDistance / len;
                const coordinates = getCoordinates(volume, voxelIndex);
                return {
                    coordinates,
                    alpha,
                    face: entryFace
                };
            }
        }
        
        // Step to next voxel boundary (always choose the nearest boundary)
        // Track which axis we stepped along to determine the entry face
        if (tMaxX < tMaxY) {
            if (tMaxX < tMaxZ) {
                currentDistance = tMaxX;
                voxelX += stepDirX;
                tMaxX += stepX;
                // Stepped along X axis - entry face is opposite to step direction
                entryFace = stepDirX > 0 ? AabbNamespace.Face.NEG_X : AabbNamespace.Face.POS_X;
            } else {
                currentDistance = tMaxZ;
                voxelZ += stepDirZ;
                tMaxZ += stepZ;
                // Stepped along Z axis - entry face is opposite to step direction
                entryFace = stepDirZ > 0 ? AabbNamespace.Face.NEG_Z : AabbNamespace.Face.POS_Z;
            }
        } else {
            if (tMaxY < tMaxZ) {
                currentDistance = tMaxY;
                voxelY += stepDirY;
                tMaxY += stepY;
                // Stepped along Y axis - entry face is opposite to step direction
                entryFace = stepDirY > 0 ? AabbNamespace.Face.NEG_Y : AabbNamespace.Face.POS_Y;
            } else {
                currentDistance = tMaxZ;
                voxelZ += stepDirZ;
                tMaxZ += stepZ;
                // Stepped along Z axis - entry face is opposite to step direction
                entryFace = stepDirZ > 0 ? AabbNamespace.Face.NEG_Z : AabbNamespace.Face.POS_Z;
            }
        }
    }
    
    return null;
};

