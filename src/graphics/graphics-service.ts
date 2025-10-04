import { Service } from "@adobe/data/service";
import { GraphicsDatabase } from "graphics/database/graphics-database.js";
import { GraphicsStore } from "./database/graphics-store.js";

export interface GraphicsService extends Service {
    database: GraphicsDatabase;
    store: GraphicsStore;
}
