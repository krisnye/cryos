import { Database } from "@adobe/data/ecs";
import { F32 } from "@adobe/data/math";
import { physics } from "./physics/physics.js";

export const scene = Database.Plugin.create({
    extends: physics,
    resources: {
        /**
         * Particle size in meters.
         */
        particleSize: { default: 0.25 as F32 },
        /**
         * Block size in meters.
         */
        blockSize: { default: 4.0 as F32 },
        /**
         * Chunk size in meters.
         */
        chunkSize: { default: 64.0 as F32 },
    },
});
