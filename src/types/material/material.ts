import { Schema } from "@adobe/data/schema";
import { schema } from "./schema.js";

export type Material = Schema.ToType<typeof schema>;

export * as Material from "./namespace.js";
