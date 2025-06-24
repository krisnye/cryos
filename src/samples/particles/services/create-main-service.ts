import { createDatabaseFromSchemas } from "@adobe/data/ecs";
import { GraphicsContext } from "../../../graphics/index.js";
import { createGraphicsDatabaseSchema } from "graphics/database/graphics-database.js";

export async function createMainService(context: GraphicsContext) {
    const graphicsDatabaseSchema = createGraphicsDatabaseSchema(context);
    const database = createDatabaseFromSchemas([graphicsDatabaseSchema]);
    return {
        serviceName: "particles-main-service",
        database,
    };
}

export type MainService = Awaited<ReturnType<typeof createMainService>>;
