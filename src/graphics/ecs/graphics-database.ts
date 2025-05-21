import { Database } from "ecs";

export type GraphicsComponents = {
}

export type GraphicsExtensions = {
    archetypes: {};
    resources: {
        readonly context: GPUCanvasContext;
        readonly canvas: HTMLCanvasElement;
        readonly device: GPUDevice;
        readonly updateSystems: {};
        readonly renderSystems: {};
    };
    observe: {};
    actions: {
        update: (commandEncoder: GPUCommandEncoder) => void;
        render: (renderPassEncoder: GPURenderPassEncoder) => void;
    }
};

export type GraphicsDatabase = Database<GraphicsComponents, GraphicsExtensions>;
