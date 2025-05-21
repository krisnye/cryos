import { Assert, Equal } from "types";
import { CoreComponents, Extensions, Database } from "ecs";
import { createDatabase } from "ecs/database";
import { GraphicsContext } from "graphics";
import { staticResources } from "ecs/extensions/static-resources";
import { GraphicsComponents, GraphicsExtensions } from "./graphics-database";

export const graphicsExtensions = (graphicsContext: GraphicsContext) => {
    return <C extends CoreComponents, E extends Extensions>(
        db: Database<C, E>
    ) => {
        return db
            .withExtension(
                staticResources({
                    ...graphicsContext,
                    updateSystems: {},
                    renderSystems: {},
                })
            )
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
    };
}

function test() {
    const graphicsContext = null as unknown as GraphicsContext;
    const db = createDatabase().withComponents({ a: { type: "number", default: 0 as number }}).withExtension(graphicsExtensions(graphicsContext)).simplifyTypes();
    type Check1 = Assert<Equal<typeof db, Database<{
        id: number;
        a: number;
    } & GraphicsComponents, GraphicsExtensions>>>;

    const db2 = db.withExtension(staticResources({
        updateSystems: {
            foo: () => {},
            bar: () => {},
        },
        renderSystems: {
            baz: () => {},
            qux: () => {},
        },
    })).simplifyTypes();
}