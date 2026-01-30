import { Database, Entity } from "@adobe/data/ecs";
import { GridWorldScale } from "types/grid-world-scale/grid-world-scale.js";
import { True } from "@adobe/data/schema";
import { volumeModel } from "./volume-model.js";
import { ColumnVolume } from "types/column-volume/column-volume.js";
import { Material } from "types/material/material.js";
import { Vec2, Vec3 } from "@adobe/data/math";

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
            volumeModel: ColumnVolume<Material.Id>;
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
    },
});
