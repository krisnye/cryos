import { Vec3, Aabb, Quat, F32, Vec4 } from "@adobe/data/math";
import { createStoreSchema, Entity, StoreFromSchema } from "@adobe/data/ecs";
import { FrameSchema } from "graphics/frame.js";
import { Camera } from "graphics/index.js";
import { Schema, TrueSchema } from "@adobe/data/schema";
import { Assert, Equal } from "@adobe/data/types";
import { Rgba, Volume } from "data/index.js";
import { KeyCode } from "ui/types/key-code.js";
import { KeyState } from "ui/types/input-state.js";
import { PointerId, PointerState } from "ui/types/pointer-state.js";

export const graphicsStoreSchema = createStoreSchema(
    {
        /**
         * Axix Aligned Bounding Box within world space.
         */
        boundingBox: Aabb.schema,
        /**
         * Local position within the parent's local space.
         */
        localPosition: Vec3.schema,
        /**
         * Local rotation within the parent's local space.
         */
        localRotation: Quat.schema,
        /**
         * Local scale within the parent's local space.
         */
        localScale: Vec3.schema,
        /**
         * World position.
         */
        position: Vec3.schema,
        /**
         * World rotation.
         */
        rotation: Quat.schema,
        /**
         * World velocity.
         */
        velocity: Vec3.schema,
        /**
         * World scale.
         */
        scale: Vec3.schema,
        /**
         * Damage taken from 0 to 1.
         */
        damage: F32.schema,
        /**
         * Color of an Entity.
         */
        color: Vec4.schema,
        /**
         * Parent Model Entity Id.
         */
        parentId: Entity.schema,
        /**
         * Mass of the object in kg.
         */
        mass: F32.schema,
        /**
         * Center of mass of the object in world space.
         */
        centerOfMass: Vec3.schema,
        gravitySource: TrueSchema,
        gravityTarget: TrueSchema,
        /**
         * Scene uniforms buffer for this viewport.
         */
        sceneUniformsBuffer: { default: null as unknown as GPUBuffer, transient: true },

        camera: Camera.schema,
        cameraControlType: { default: "orbit" satisfies Camera.ControlType as Camera.ControlType },
        context: { default: null as unknown as GPUCanvasContext, transient: true },
        depthTexture: { default: null as unknown as GPUTexture, transient: true },

        modelId: Entity.schema,

        voxelColor: { default: null as unknown as Volume<Rgba> },
        modelVertexBuffer: { default: null as unknown as GPUBuffer },
        modelVertexCount: { default: 0 },
        voxelVertexSource: { default: null as unknown as Volume<Rgba> },

        pickable: TrueSchema,
    },
    {
        gravitationalConstant: { default: 1e-2 as F32 },
        device: { default: null as GPUDevice | null, transient: true },

        timeScale: { default: 1.0 as F32 },
        lightDirection: { default: Vec3.normalize([-1, -3, -10]) as Vec3 },
        ambientStrength: { default: 0.5 as F32 },
        lightColor: { default: [1.0, 1.0, 1.0] as Vec3 },
        // valid during update phase
        updateFrame: FrameSchema,
        commandEncoder: { default: null as GPUCommandEncoder | null, transient: true },
        // active during render phase
        activeViewport: Entity.schema,

        // typed as not null because render phase will never be called if there is no render pass encoder
        renderPassEncoder: { default: null as unknown as GPURenderPassEncoder, transient: true },
        renderFrame: FrameSchema,
        
        // Input state
        pressedKeys: {
            mutable: true,
            default: {} as Partial<Record<KeyCode, KeyState>>,
        },
        activePointers: {
            mutable: true,
            default: {} as Record<PointerId, PointerState>,
        },
    },
    {
        Viewport: [
            "camera",
            "context",
            "cameraControlType",
            "depthTexture",
            "color",
            "sceneUniformsBuffer",
        ],
        VoxelModel: [
            "position",
            "scale",
            "rotation",
            "voxelColor",
            "centerOfMass"
        ],
        Particle: [
            "position",
            "color",
            "scale",
            "rotation",
        ],
        RenderModel: [
            "position",
            "scale",
            "rotation",
            "modelVertexBuffer",
        ],
    },
);

export type GraphicsStore = StoreFromSchema<typeof graphicsStoreSchema>;
export type Viewport = Parameters<GraphicsStore["archetypes"]["Viewport"]["insert"]>[0];
export type Particle = Parameters<GraphicsStore["archetypes"]["Particle"]["insert"]>[0];
export type VoxelModel = Parameters<GraphicsStore["archetypes"]["VoxelModel"]["insert"]>[0];
export type RenderModel = Parameters<GraphicsStore["archetypes"]["RenderModel"]["insert"]>[0];

declare const foo: GraphicsStore;
// @ts-expect-error
type CheckComponentsMissing = Assert<Equal<typeof foo.componentSchemas.missing, Schema>>;
type CheckComponents = Assert<Equal<typeof foo.componentSchemas.boundingBox, Schema>>;

type CheckResources = Assert<Equal<typeof foo.resources.device, GPUDevice | null>>;
// @ts-expect-error
type CheckResourcesMissing = Assert<Equal<typeof foo.resources.missing, GPUCanvasContext | null>>;
