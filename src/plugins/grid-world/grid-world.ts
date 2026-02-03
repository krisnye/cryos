import { Database, Entity } from "@adobe/data/ecs";
import { GridWorldScale } from "types/grid-world-scale/grid-world-scale.js";
import { True } from "@adobe/data/schema";
import { volumeModel } from "../volume-model.js";
import { ColumnVolume } from "types/column-volume/column-volume.js";
import { Material } from "types/material/material.js";
import { PhysicalVoxel } from "types/physical-voxel/physical-voxel.js";
import { Vec2, Vec3, Line3, Aabb } from "@adobe/data/math";
import { PickResult } from "types/pick-result.js";
import * as VolumeNamespace from "types/volume/public.js";

const getWorldChunkKey = (chunkX: number, chunkY: number): number => {
    return chunkX * 10000 + chunkY;
};

export const scene = Database.Plugin.create({
    extends: volumeModel,
    components: {
        worldChunk: True.schema,
    },
    resources: {
        worldScale: { default: GridWorldScale.create({}) },
        worldChunks: { default: new Map<number, Entity>() },
    },
    archetypes: {
        WorldChunk: ["worldChunk", "position", "volumeModel", "materialVolume", "scale"],
    },
    transactions: {
        createWorldChunk(t, props: {
            chunkX: number;
            chunkY: number;
            volumeModel: ColumnVolume<PhysicalVoxel>;
        }) {
            const { chunkSize, blockSize } = t.resources.worldScale;
            const position: Vec3 = [props.chunkX * chunkSize, props.chunkY * chunkSize, 0];
            const entity = t.archetypes.WorldChunk.insert({
                worldChunk: true,
                volumeModel: true,
                position,
                materialVolume: props.volumeModel,
                scale: [blockSize, blockSize, blockSize],
            });
            t.resources.worldChunks.set(getWorldChunkKey(props.chunkX, props.chunkY), entity);
            return entity;
        },
        deleteWorldChunk(t, entityId: Entity) {
            t.delete(entityId);
            const position = t.get(entityId, "position")!;
            t.resources.worldChunks.delete(getWorldChunkKey(position[0], position[1]));
        }
    },
    actions: {
        getWorldChunkByIndex: (db, index: Vec2) => {
            return db.resources.worldChunks.get(getWorldChunkKey(index[0], index[1]));
        },
        getWorldChunkByPosition: (db, position: Vec3) => {
            return db.resources.worldChunks.get(
                getWorldChunkKey(
                    Math.floor(position[0] / db.resources.worldScale.chunkSize),
                    Math.floor(position[1] / db.resources.worldScale.chunkSize),
                )
            );
        },
        pickWorld: (db, line: Line3): PickResult | null => {
            const { worldChunks, worldScale } = db.resources;
            const { chunkSize, blockSize } = worldScale;
            
            // Broad-phase: Find candidate chunks that the line might intersect
            const candidates: Array<{
                entity: Entity;
                position: Vec3;
                volume: ColumnVolume<PhysicalVoxel>;
                intersectionAlpha: number;
            }> = [];
            
            // Calculate bounding box of line in world space
            const minX = Math.min(line.a[0], line.b[0]);
            const maxX = Math.max(line.a[0], line.b[0]);
            const minY = Math.min(line.a[1], line.b[1]);
            const maxY = Math.max(line.a[1], line.b[1]);
            
            // Calculate chunk indices that line passes through
            const minChunkX = Math.floor(minX / chunkSize);
            const maxChunkX = Math.floor(maxX / chunkSize);
            const minChunkY = Math.floor(minY / chunkSize);
            const maxChunkY = Math.floor(maxY / chunkSize);
            
            // Iterate through potential chunks
            for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
                for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                    const chunkKey = getWorldChunkKey(chunkX, chunkY);
                    const chunkEntity = worldChunks.get(chunkKey);
                    
                    if (!chunkEntity) continue;
                    
                    // Get chunk data
                    const chunkPosition = db.get(chunkEntity, "position");
                    const chunkVolume = db.get(chunkEntity, "materialVolume") as ColumnVolume<PhysicalVoxel>;
                    
                    if (!chunkPosition || !chunkVolume) continue;
                    
                    // Calculate world-space AABB for chunk
                    // Chunk position is at [chunkX * chunkSize, chunkY * chunkSize, 0]
                    // Chunk size in model space is volume.size
                    // World space size = model space size * blockSize
                    const worldAabb: Aabb = {
                        min: [
                            chunkPosition[0],
                            chunkPosition[1],
                            chunkPosition[2]
                        ],
                        max: [
                            chunkPosition[0] + chunkVolume.size[0] * blockSize,
                            chunkPosition[1] + chunkVolume.size[1] * blockSize,
                            chunkPosition[2] + chunkVolume.size[2] * blockSize
                        ]
                    };
                    
                    // Fast AABB intersection test
                    const intersectionAlpha = Aabb.lineIntersection(worldAabb, line);
                    
                    if (intersectionAlpha !== -1) {
                        candidates.push({
                            entity: chunkEntity,
                            position: chunkPosition,
                            volume: chunkVolume,
                            intersectionAlpha
                        });
                    }
                }
            }
            
            // Sort candidates by intersection alpha (closest first) for early exit
            candidates.sort((a, b) => a.intersectionAlpha - b.intersectionAlpha);
            
            // Narrow-phase: Pick from closest chunk first
            for (const candidate of candidates) {
                // Transform line from world space to chunk model space
                const modelLine: Line3 = {
                    a: [
                        (line.a[0] - candidate.position[0]) / blockSize,
                        (line.a[1] - candidate.position[1]) / blockSize,
                        (line.a[2] - candidate.position[2]) / blockSize
                    ],
                    b: [
                        (line.b[0] - candidate.position[0]) / blockSize,
                        (line.b[1] - candidate.position[1]) / blockSize,
                        (line.b[2] - candidate.position[2]) / blockSize
                    ]
                };
                
                // Pick directly from ColumnVolume without conversion (pickable = not air)
                const pickResult = VolumeNamespace.pick(
                    candidate.volume,
                    modelLine,
                    (voxel) => PhysicalVoxel.getMaterialId(voxel) !== Material.ids.air
                );
                
                if (pickResult) {
                    // Transform result back to world space
                    // Voxel coordinates are integer indices, but voxels are centered at [x+0.5, y+0.5, z+0.5]
                    // So we add 0.5 to get the voxel center before scaling
                    const worldPosition: Vec3 = [
                        candidate.position[0] + (pickResult.coordinates[0] + 0.5) * blockSize,
                        candidate.position[1] + (pickResult.coordinates[1] + 0.5) * blockSize,
                        candidate.position[2] + (pickResult.coordinates[2] + 0.5) * blockSize
                    ];
                    
                    // Calculate world-space line alpha
                    // The pick result alpha is relative to the model-space line
                    // We need to account for the transformation, but since we're using the same
                    // line direction, the alpha should be approximately correct
                    // However, we should recalculate it based on world position for accuracy
                    const lineDir: Vec3 = [
                        line.b[0] - line.a[0],
                        line.b[1] - line.a[1],
                        line.b[2] - line.a[2]
                    ];
                    const lineLength = Math.sqrt(
                        lineDir[0] * lineDir[0] +
                        lineDir[1] * lineDir[1] +
                        lineDir[2] * lineDir[2]
                    );
                    
                    if (lineLength > 0.0001) {
                        // Calculate alpha based on distance from line.a to worldPosition
                        const toPick: Vec3 = [
                            worldPosition[0] - line.a[0],
                            worldPosition[1] - line.a[1],
                            worldPosition[2] - line.a[2]
                        ];
                        const dotProduct = 
                            toPick[0] * lineDir[0] +
                            toPick[1] * lineDir[1] +
                            toPick[2] * lineDir[2];
                        const lineAlpha = dotProduct / (lineLength * lineLength);
                        
                        return {
                            entity: candidate.entity,
                            lineAlpha: Math.max(0, Math.min(1, lineAlpha)),
                            worldPosition,
                            modelPosition: pickResult.coordinates,
                            face: pickResult.face
                        };
                    }
                }
            }
            
            return null;
        },
    },
});

