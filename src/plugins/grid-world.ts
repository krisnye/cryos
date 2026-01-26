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
         * Block size in particles.
         */
        blockSize: { default: 16 as F32 },
        /**
         * Chunk size in blocks.
         */
        chunkSize: { default: 16 as F32 },
    },
});
