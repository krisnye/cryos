import { createDatabaseSchema, DatabaseFromSchema } from "@adobe/data/ecs";
import { Rgba, Volume } from "data/index.js";
import { graphicsStoreSchema } from "./graphics-store.js";
import * as graphicsTransactions from "./transactions/index.js";

const graphicsDatabaseSchema = createDatabaseSchema(graphicsStoreSchema.components, graphicsStoreSchema.resources, graphicsStoreSchema.archetypes, graphicsTransactions);

// we omit observe because it causes databases which extend this one to not match the type.
export type GraphicsDatabase = DatabaseFromSchema<typeof graphicsDatabaseSchema>;

