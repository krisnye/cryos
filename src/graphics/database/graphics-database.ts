import { GraphicsContext } from "graphics/graphics-context.js";
import { AsyncArgsProvider, createDatabaseSchema, DatabaseFromSchema, Entity, StoreFromSchema } from "@adobe/data/ecs";
import { Frame, FrameSchema } from "graphics/frame.js";
import { Camera, CameraSchema } from "graphics/camera/camera.js";
import * as VEC3 from "math/vec3/index.js";
import { F32Schema, Schema, U32Schema } from "@adobe/data/schema";
import { AabbSchema } from "math/aabb/aabb.js";
import { Assert, Equal } from "@adobe/data/types";

export const createGraphicsDatabaseSchema = (context: GraphicsContext) => {
    const T = createDatabaseSchema(
        {
            boundingBox: AabbSchema,
        },
        {
            graphics: { default: context, transient: true },
            camera: {
                ...CameraSchema,
                default: {
                    aspect: context.canvas.width / context.canvas.height,
                    fieldOfView: Math.PI / 4,
                    nearPlane: 0.1,
                    farPlane: 100.0,
                    position: [0, 0, 20],
                    target: [0, 0, 0],
                    up: [0, 1, 0],
                } satisfies Camera
            },
            timeScale: { ...F32Schema, default: 1.0 },
            lightDirection: { ...VEC3.Vec3Schema, default: VEC3.normalize([1, 2, 5.0]) },
            ambientStrength: { ...F32Schema, default: 0.5 },
            lightColor: { ...VEC3.Vec3Schema, default: [1.2, 1.2, 1.2] as VEC3.Vec3 },
            sceneBuffer: { default: null as unknown as GPUBuffer, transient: true },
            // valid during update phase
            commandEncoder: { default: null as unknown as GPUCommandEncoder, transient: true },
            updateFrame: FrameSchema,
            // valid during the render phase
            renderPassEncoder: { default: null as unknown as GPURenderPassEncoder, transient: true },
            renderFrame: FrameSchema,
        },
        {
        },
        (store) => {
            return ({
                setUpdateFrame: (frame: Frame) => {
                    store.resources.updateFrame = frame;
                },
                setRenderFrame: (frame: Frame) => {
                    store.resources.renderFrame = frame;
                },
                updateCamera: (camera: Partial<Camera>) => {
                    store.resources.camera = {
                        ...store.resources.camera,
                        ...camera
                    };
                }
            })
        }
    );
    return T;
}

export type GraphicsDatabase = DatabaseFromSchema<ReturnType<typeof createGraphicsDatabaseSchema>>;
export type GraphicsStore = StoreFromSchema<ReturnType<typeof createGraphicsDatabaseSchema>>;

declare const foo: GraphicsDatabase;
// @ts-expect-error
type CheckComponentsMissing = Assert<Equal<typeof foo.componentSchemas.missing, Schema>>;
type CheckComponents = Assert<Equal<typeof foo.componentSchemas.boundingBox, Schema>>;

type CheckResources = Assert<Equal<typeof foo.resources.graphics, GraphicsContext>>;
// @ts-expect-error
type CheckResourcesMissing = Assert<Equal<typeof foo.resources.missing, GraphicsContext>>;

type CheckTransactions = Assert<Equal<typeof foo.transactions.setUpdateFrame, (arg: {
    readonly count: number;
    readonly deltaTime: number;
} | AsyncArgsProvider<{
    readonly count: number;
    readonly deltaTime: number;
}>) => void>>;
// @ts-expect-error
type CheckTransactionsMissing = Assert<Equal<typeof foo.transactions.missing, (arg: {
    readonly count: number;
} | AsyncArgsProvider<{
    readonly count: number;
}>) => void>>;