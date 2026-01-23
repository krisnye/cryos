import { Database } from "@adobe/data/ecs";
import { materialVertexBuffers } from "plugins/material-vertex-buffers.js";
import { materials } from "plugins/materials.js";
import { scene } from "plugins/scene.js";

export const baseVertexBufferRenderer = Database.Plugin.combine(materialVertexBuffers, scene, materials);

