
import { Schema } from "@adobe/data/schema";
import { schema } from "./schema.js";

export type Aabb = Schema.ToType<typeof schema>;

export * as Aabb from "./public.js";