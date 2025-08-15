import { Vec3 } from "math/vec3/index.js";

export const FACE = {
    POS_Z: 0,
    POS_X: 1,
    NEG_Z: 2,
    NEG_X: 3,
    POS_Y: 4,
    NEG_Y: 5,
} as const;

export type Face = typeof FACE[keyof typeof FACE];

export const FaceMeta: Record<number, {
    name: string;
    direction: Vec3;
}> = {
    [FACE.POS_Z]: {
        name: "POS_Z",
        direction: [0, 0, 1],
    },
    [FACE.POS_X]: {
        name: "POS_X",
        direction: [1, 0, 0],
    },
    [FACE.NEG_Z]: {
        name: "NEG_Z",
        direction: [0, 0, -1],
    },
    [FACE.NEG_X]: {
        name: "NEG_X",
        direction: [-1, 0, 0],
    },
    [FACE.POS_Y]: {
        name: "POS_Y",
        direction: [0, 1, 0],
    },
    [FACE.NEG_Y]: {
        name: "NEG_Y",
        direction: [0, -1, 0],
    },
} as const satisfies Record<Face, {
    name: string;
    direction: Vec3;
}>;