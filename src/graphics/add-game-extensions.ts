import { Assert, Equal } from "types";
import { CoreComponents, Extensions, Database } from "ecs";
import { createDatabase } from "ecs/database";
import { F32Schema } from "data";
import { GraphicsContext } from "graphics";

export const addGameExtensions = <
    C extends CoreComponents,
    E extends Extensions,
>(
    db: Database<C, E>,
    graphicsContext: GraphicsContext,
) => {
    return db.withComponents({
        changedTime: F32Schema
    } as const)
    .withResources({
        ...graphicsContext,
        deltaTime: 1 / 60,
        updateSystems: {},
        renderSystems: {},
    })
    .withActions({
        update(commandEncoder: GPUCommandEncoder) {
            for (const name in this.resources.updateSystems) {
                (this.resources.updateSystems as any)[name](commandEncoder);
            }
        },
        render(renderPassEncoder: GPURenderPassEncoder) {
            for (const name in this.resources.renderSystems) {
                (this.resources.renderSystems as any)[name](renderPassEncoder);
            }
        }
    });
}

type GameComponents = CoreComponents & {
    changedTime: number;
};
type GameExtensions = {
    archetypes: {};
    resources: {
        deltaTime: number;
        context: GPUCanvasContext;
        canvas: HTMLCanvasElement;
        device: GPUDevice;
        updateSystems: {};
        renderSystems: {};
    };
    observe: {};
    actions: {
        update: (commandEncoder: GPUCommandEncoder) => void;
        render: (renderPassEncoder: GPURenderPassEncoder) => void;
    }
};

function test() {
    const db = addGameExtensions(createDatabase().withComponents({ a: { type: "number" }}), null as unknown as GraphicsContext).simplifyTypes();
    type Check1 = Assert<Equal<typeof db, Database<{
        id: number;
        a: number;
        changedTime: number;
    }, GameExtensions>>>;

    const db2 = db.withResources({
        updateSystems: {
            foo: () => {},
            bar: () => {},
        },
        renderSystems: {
            baz: () => {},
            qux: () => {},
        },
    }).simplifyTypes();
}